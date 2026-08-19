import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateModuleFileDto } from './dto/create-module.dto';
import { Role, ModuleFileType } from '@prisma/client';
import { CalendarService } from '../calendar/calendar.service';
import { NotificationsQueueService } from '../notifications/notifications-queue.service';
import { AutoValidator } from '../common/base/validation-guide';

// Heuristic #1: Visibility of System Status — clear success/error messages
// Heuristic #5: Error Prevention — validate permissions and data before operations
// Heuristic #12: Clarity of Purpose and Objectives — require learning objectives
// Heuristic #23: Relevancy — track updatedAt for content freshness

@Injectable()
export class ModulesService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private calendarService: CalendarService,
    private notificationsQueueService: NotificationsQueueService,
  ) {}

  /**
   * Create a new module (Admin or course instructor only)
   * Heuristic #12: Clarity of Purpose and Objectives — learning objectives required
   * ✅ MENGGUNAKAN AutoValidator untuk otomatis format handling
   */
  async create(
    courseId: string,
    userId: string,
    userRole: Role,
    dto: CreateModuleDto,
  ) {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      title: { type: 'string', required: true, maxLength: 200 },
      description: { type: 'string', required: false, maxLength: 2000 },
      learningObjectives: { type: 'string', required: false, maxLength: 5000 },
      order: { type: 'number', required: false, min: 1 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate dan normalize courseId
    const validatedCourseId = AutoValidator.validateUUID(courseId, 'Course ID');

    // Check course access
    const course = await this.prisma.course.findUnique({
      where: { id: validatedCourseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only Admin and course instructor can create modules',
      );
    }

    // Auto-generate order if not provided
    let order = result.sanitized.order;
    if (order === undefined) {
      const lastModule = await this.prisma.module.findFirst({
        where: { courseId: validatedCourseId },
        orderBy: { order: 'desc' },
      });
      order = lastModule ? lastModule.order + 1 : 1;
    }

    // ✅ Create dengan data yang sudah divalidasi
    const module = await this.prisma.module.create({
      data: {
        courseId: validatedCourseId,
        title: result.sanitized.title,
        description: result.sanitized.description,
        learningObjectives: result.sanitized.learningObjectives,
        order: result.sanitized.order ?? 0,
      },
      include: {
        files: true,
      },
    });

    // Automatically create calendar event
    await this.calendarService.createEventFromModule(module.id);

    // Send notifications to enrolled students via queue
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: validatedCourseId },
      select: { userId: true },
    });

    const studentIds = enrollments.map((e: any) => e.userId);
    await this.notificationsQueueService.addBulkNotificationJob({
      userIds: studentIds,
      type: 'MATERIAL_PUBLISHED',
      title: 'Materi Baru Tersedia',
      message: `Materi "${module.title}" telah ditambahkan di course "${course.name}"`,
      link: `/mahasiswa/courses/${courseId}/modules/${module.id}`,
    });

    return {
      success: true,
      data: module,
      message: 'Module created successfully',
    };
  }

  /**
   * Get module by ID
   * Heuristic #12: Clarity of Purpose and Objectives — display learning objectives
   */
  async findOne(id: string, userId: string, userRole: Role) {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true } },
          },
        },
        files: {
          orderBy: { uploadedAt: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { courseId: module.courseId, userId },
    });

    // Check access permissions
    const hasAccess =
      userRole === Role.ADMIN ||
      module.course.instructorId === userId ||
      !!enrollment;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this module');
    }

    return {
      success: true,
      data: module,
      message: 'Module retrieved successfully',
    };
  }

  /**
   * Update module (Admin or course instructor only)
   * Heuristic #23: Relevancy — updatedAt automatically tracked
   */
  async update(
    id: string,
    userId: string,
    userRole: Role,
    dto: UpdateModuleDto,
  ) {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only Admin and course instructor can update this module',
      );
    }

    const updatedModule = await this.prisma.module.update({
      where: { id },
      data: dto,
      include: {
        files: true,
      },
    });

    await this.calendarService.createEventFromModule(updatedModule.id);

    return {
      success: true,
      data: updatedModule,
      message: 'Module updated successfully',
    };
  }

  /**
   * Delete module (Admin or course instructor only)
   * Heuristic #3: User Control and Freedom — allow deletion with proper checks
   */
  async remove(id: string, userId: string, userRole: Role) {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: {
        course: true,
        files: true,
      },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only Admin and course instructor can delete this module',
      );
    }

    // Delete files from storage
    for (const file of module.files) {
      const key = this.storageService.extractKeyFromUrl(file.fileUrl);
      await this.storageService.deleteFile(key, false);
    }

    await this.prisma.module.delete({
      where: { id },
    });

    return {
      success: true,
      data: null,
      message: 'Module deleted successfully',
    };
  }

  /**
   * Add file to module
   * Heuristic #17: Instructional Material — support various file types
   */
  async addFile(
    moduleId: string,
    userId: string,
    userRole: Role,
    dto: CreateModuleFileDto,
  ) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: true,
      },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only Admin and course instructor can add files to this module',
      );
    }

    // Determine file type based on MIME type
    let fileType: ModuleFileType = ModuleFileType.OTHER;
    if (dto.fileType === 'application/pdf') {
      fileType = ModuleFileType.PDF;
    } else if (dto.fileType.startsWith('video/')) {
      fileType = ModuleFileType.VIDEO;
    } else if (
      dto.fileType === 'application/msword' ||
      dto.fileType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      fileType = ModuleFileType.DOCUMENT;
    } else if (
      dto.fileType === 'application/vnd.ms-powerpoint' ||
      dto.fileType ===
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      fileType = ModuleFileType.SLIDE;
    }

    const moduleFile = await this.prisma.moduleFile.create({
      data: {
        moduleId,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileType,
        fileSize: BigInt(dto.fileSize),
      },
    });

    return {
      success: true,
      data: moduleFile,
      message: 'File added to module successfully',
    };
  }

  /**
   * Delete file from module
   * Heuristic #3: User Control and Freedom — allow file removal
   */
  async removeFile(fileId: string, userId: string, userRole: Role) {
    const moduleFile = await this.prisma.moduleFile.findUnique({
      where: { id: fileId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!moduleFile) {
      throw new NotFoundException('File not found');
    }

    // Check permissions
    if (
      userRole !== Role.ADMIN &&
      moduleFile.module.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'Only Admin and course instructor can delete this file',
      );
    }

    // Delete from storage
    const key = this.storageService.extractKeyFromUrl(moduleFile.fileUrl);
    await this.storageService.deleteFile(key, false);

    // Delete from database
    await this.prisma.moduleFile.delete({
      where: { id: fileId },
    });

    return {
      success: true,
      data: null,
      message: 'File deleted successfully',
    };
  }

  /**
   * Get all modules for a course
   * Heuristic #15: Learning Design — structured module order
   */
  async findByCourse(courseId: string, userId: string, userRole: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { courseId, userId },
    });

    // Check access permissions
    const hasAccess =
      userRole === Role.ADMIN || course.instructorId === userId || !!enrollment;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this course');
    }

    const modules = await this.prisma.module.findMany({
      where: { courseId },
      include: {
        files: true,
      },
      orderBy: { order: 'asc' },
    });

    return {
      success: true,
      data: modules,
      message: 'Modules retrieved successfully',
    };
  }

  /**
   * Reorder modules
   * Heuristic #15: Learning Design — allow structuring module sequence
   */
  async reorder(
    courseId: string,
    userId: string,
    userRole: Role,
    moduleOrders: { id: string; order: number }[],
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only Admin and course instructor can reorder modules',
      );
    }

    // Update orders in transaction
    await this.prisma.$transaction(
      moduleOrders.map(({ id, order }) =>
        this.prisma.module.update({
          where: { id },
          data: { order },
        }),
      ),
    );

    return {
      success: true,
      data: null,
      message: 'Modules reordered successfully',
    };
  }
}
