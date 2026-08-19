import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeekDto } from './dto/create-week.dto';
import { UpdateWeekDto } from './dto/update-week.dto';
import { Role } from '@prisma/client';
import { AutoValidator } from '../common/base/validation-guide';

@Injectable()
export class WeeksService {
  constructor(private prisma: PrismaService) {}

  async findByCourse(courseId: string, userId: string, userRole: Role) {
    // Check if user has access to the course
    await this.checkCourseAccess(courseId, userId, userRole);

    const canSeeUnpublished =
      userRole === Role.ADMIN || userRole === Role.DOSEN;

    const weeks = await this.prisma.week.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        activities: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // For each week, fetch associated exams
    const weeksWithExams = await Promise.all(
      weeks.map(async (week) => {
        const exams = await this.prisma.exam.findMany({
          where: {
            weekId: week.id,
            ...(canSeeUnpublished ? {} : { isPublished: true }),
          },
          include: {
            _count: {
              select: {
                questions: true,
                attempts: true,
              },
            },
          },
          orderBy: { startTime: 'asc' },
        });

        return {
          ...week,
          exams,
        };
      }),
    );

    return weeksWithExams;
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const week = await this.prisma.week.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!week) {
      throw new NotFoundException('Week not found');
    }

    // Check if user has access to the course
    await this.checkCourseAccess(week.courseId, userId, userRole);

    return week;
  }

  async create(
    courseId: string,
    dto: CreateWeekDto,
    userId: string,
    userRole: Role,
  ) {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      title: { type: 'string', required: true, maxLength: 200 },
      weekNumber: { type: 'number', required: true, min: 1 },
      startDate: { type: 'date', required: true },
      endDate: { type: 'date', required: true },
      order: { type: 'number', required: false, min: 1 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate dan normalize courseId
    const validatedCourseId = AutoValidator.validateUUID(courseId, 'Course ID');

    // Only ADMIN and DOSEN can create weeks
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can create weeks');
    }

    // Check if user has access to the course
    await this.checkCourseAccess(validatedCourseId, userId, userRole);

    // ✅ Create dengan data yang sudah divalidasi
    return this.prisma.week.create({
      data: {
        courseId: validatedCourseId,
        ...result.sanitized,
      },
      include: {
        activities: true,
      },
    });
  }

  async update(id: string, dto: UpdateWeekDto, userId: string, userRole: Role) {
    // ✅ Auto-validation untuk field yang di-update
    const result = AutoValidator.validateObject(dto, {
      title: { type: 'string', required: false, maxLength: 200 },
      weekNumber: { type: 'number', required: false, min: 1 },
      startDate: { type: 'date', required: false },
      endDate: { type: 'date', required: false },
      order: { type: 'number', required: false, min: 1 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate week ID
    const validatedId = AutoValidator.validateUUID(id, 'Week ID');

    // Only ADMIN and DOSEN can update weeks
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can update weeks');
    }

    const week = await this.findOne(validatedId, userId, userRole);

    // ✅ Update dengan data yang sudah divalidasi
    return this.prisma.week.update({
      where: { id: validatedId },
      data: result.sanitized,
      include: {
        activities: true,
      },
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    // Only ADMIN and DOSEN can delete weeks
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can delete weeks');
    }

    const week = await this.findOne(id, userId, userRole);

    return this.prisma.week.delete({
      where: { id },
    });
  }

  async reorder(
    courseId: string,
    weekOrders: { id: string; order: number }[],
    userId: string,
    userRole: Role,
  ) {
    // Only ADMIN and DOSEN can reorder weeks
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can reorder weeks');
    }

    // Check if user has access to the course
    await this.checkCourseAccess(courseId, userId, userRole);

    // Update orders in a transaction
    return this.prisma.$transaction(
      weekOrders.map(({ id, order }) =>
        this.prisma.week.update({
          where: { id },
          data: { order },
        }),
      ),
    );
  }

  private async checkCourseAccess(
    courseId: string,
    userId: string,
    userRole: Role,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Admin has access to all courses
    if (userRole === Role.ADMIN) {
      return;
    }

    // Dosen can only access their own courses
    if (userRole === Role.DOSEN) {
      if (course.instructorId !== userId) {
        throw new ForbiddenException('You do not have access to this course');
      }
      return;
    }

    // Mahasiswa can only access enrolled courses
    if (userRole === Role.MAHASISWA) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('You are not enrolled in this course');
      }
      return;
    }

    throw new ForbiddenException('You do not have access to this course');
  }
}
