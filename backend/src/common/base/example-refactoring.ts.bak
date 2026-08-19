/**
 * CONTOH REFACTORING MENGGUNAKAN BASE CLASS
 * 
 * Ini adalah contoh bagaimana courses.service.ts bisa direfactor menggunakan BaseService
 * untuk mengurangi boilerplate code dan membuatnya lebih konsisten.
 */

// ============================================
// SEBELUM (Original courses.service.ts)
// ============================================

/*
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Role, EnrollmentRole } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, userRole: Role, dto: CreateCourseDto) {
    // Manual permission check
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can create courses');
    }

    // Manual validation
    const existingCourse = await this.prisma.course.findUnique({
      where: { code: dto.code },
    });

    if (existingCourse) {
      throw new ConflictException('Course code already exists');
    }

    // Manual category validation
    const categoryId = dto.categoryId && dto.categoryId.trim() !== '' ? dto.categoryId : undefined;
    
    if (categoryId) {
      const category = await this.prisma.courseCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const course = await this.prisma.course.create({
      data: {
        ...dto,
        categoryId,
        enrollmentCode: this.generateEnrollmentCode(),
        instructorId: userId,
      },
      include: {
        category: true,
        instructor: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      data: course,
      message: 'Course created successfully',
    };
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        instructor: { select: { id: true, name: true, email: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: { files: true },
        },
        assignments: { orderBy: { deadline: 'asc' } },
        exams: { orderBy: { startTime: 'asc' } },
        _count: {
          select: {
            enrollments: true,
            modules: true,
            assignments: true,
            exams: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Manual access control
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: id } },
    });

    const hasAccess =
      userRole === Role.ADMIN ||
      course.instructorId === userId ||
      !!enrollment;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this course');
    }

    return {
      success: true,
      data: course,
      message: 'Course retrieved successfully',
    };
  }
  
  // ... more methods with similar patterns
}
*/

// ============================================
// SESUDAH (Refactored dengan BaseService)
// ============================================

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Role, EnrollmentRole } from '@prisma/client';
import { BaseService } from '../common/base/base.service';

@Injectable()
export class CoursesServiceRefactored extends BaseService<any> {
  constructor(private prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Create a new course (Admin or Dosen only)
   * Heuristic #5: Error Prevention — validate instructor exists
   */
  async create(userId: string, userRole: Role, dto: CreateCourseDto) {
    // ✅ Permission check otomatis dari base class
    this.checkRoleAccess(userRole, [Role.ADMIN, Role.DOSEN]);

    // Check if course code already exists
    const existingCourse = await this.prisma.course.findUnique({
      where: { code: dto.code },
    });

    if (existingCourse) {
      throw new ConflictException('Course code already exists');
    }

    // ✅ Sanitize optional ID otomatis dari base class
    const categoryId = this.sanitizeOptionalId(dto.categoryId);
    
    if (categoryId) {
      const category = await this.prisma.courseCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Generate unique enrollment code
    const enrollmentCode = this.generateEnrollmentCode();

    const course = await this.prisma.course.create({
      data: {
        ...dto,
        categoryId,
        enrollmentCode,
        instructorId: userId,
      },
      include: {
        category: true,
        instructor: { select: { id: true, name: true } },
      },
    });

    // ✅ Response formatting otomatis dari base class
    return this.formatResponse(course, 'Course created successfully');
  }

  /**
   * Get course by ID
   * Heuristic #6: Recognition Rather Than Recall — provide full course details
   */
  async findOne(id: string, userId: string, userRole: Role) {
    const course = await this.findById(
      id,
      this.prisma.course,
      {
        include: {
          category: true,
          instructor: { select: { id: true, name: true, email: true } },
          modules: {
            orderBy: { order: 'asc' },
            include: { files: true },
          },
          assignments: { orderBy: { deadline: 'asc' } },
          exams: { orderBy: { startTime: 'asc' } },
          _count: {
            select: {
              enrollments: true,
              modules: true,
              assignments: true,
              exams: true,
            },
          },
        },
      },
      'Course not found'
    );

    // Check access permissions
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: id } },
    });

    const hasAccess =
      userRole === Role.ADMIN ||
      course.instructorId === userId ||
      !!enrollment;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this course');
    }

    const canSeeUnpublished =
      userRole === Role.ADMIN || course.instructorId === userId;

    const data = {
      ...course,
      exams: canSeeUnpublished
        ? course.exams
        : course.exams.filter((exam: any) => exam.isPublished),
    };

    // ✅ Response formatting otomatis
    return this.formatResponse(data, 'Course retrieved successfully');
  }

  /**
   * Update course (Admin or course instructor only)
   * Heuristic #3: User Control and Freedom — allow editing course details
   */
  async update(id: string, userId: string, userRole: Role, dto: UpdateCourseDto) {
    const course = await this.findById(
      id,
      this.prisma.course,
      {},
      'Course not found'
    );

    // ✅ Ownership check otomatis dari base class
    this.checkOwnershipOrAdmin(course.instructorId, userId, userRole);

    // ✅ Sanitize optional ID otomatis
    const categoryId = this.sanitizeOptionalId(dto.categoryId);
    
    if (categoryId) {
      const category = await this.prisma.courseCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Check if new code conflicts with existing course
    if (dto.code && dto.code !== course.code) {
      const existingCourse = await this.prisma.course.findUnique({
        where: { code: dto.code },
      });

      if (existingCourse) {
        throw new ConflictException('Course code already exists');
      }
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: {
        ...dto,
        categoryId,
      },
      include: {
        category: true,
        instructor: { select: { id: true, name: true } },
      },
    });

    // ✅ Response formatting otomatis
    return this.formatResponse(updatedCourse, 'Course updated successfully');
  }

  /**
   * Delete course (Admin or course instructor only)
   * Heuristic #3: User Control and Freedom — allow deletion with proper checks
   */
  async remove(id: string, userId: string, userRole: Role) {
    const course = await this.findById(
      id,
      this.prisma.course,
      {
        include: {
          _count: {
            select: {
              enrollments: true,
              modules: true,
              assignments: true,
              exams: true,
            },
          },
        },
      },
      'Course not found'
    );

    // ✅ Ownership check otomatis
    this.checkOwnershipOrAdmin(course.instructorId, userId, userRole);

    // Prevent deletion if course has active enrollments (optional safety check)
    if (course._count.enrollments > 0 && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Cannot delete course with active enrollments. Contact Admin.');
    }

    // ✅ Generic delete otomatis dari base class
    return this.deleteResource(id, this.prisma.course, 'Course deleted successfully');
  }

  // Helper method untuk generate enrollment code (tetap custom)
  private generateEnrollmentCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}

// ============================================
// PERBANDINGAN
// ============================================

/**
 * KEUNTUNGAN MENGGUNAKAN BASE SERVICE:
 * 
 * 1. ✅ Permission Checking:
 *    - SEBELUM: if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) { ... }
 *    - SESUDAH: this.checkRoleAccess(userRole, [Role.ADMIN, Role.DOSEN]);
 * 
 * 2. ✅ Response Formatting:
 *    - SEBELUM: return { success: true, data: course, message: '...' };
 *    - SESUDAH: return this.formatResponse(course, '...');
 * 
 * 3. ✅ ID Sanitization:
 *    - SEBELUM: const categoryId = dto.categoryId && dto.categoryId.trim() !== '' ? dto.categoryId : undefined;
 *    - SESUDAH: const categoryId = this.sanitizeOptionalId(dto.categoryId);
 * 
 * 4. ✅ Error Handling:
 *    - SEBELUM: Manual try-catch dan error throwing
 *    - SESUDAH: findById() otomatis throws NotFoundException
 * 
 * 5. ✅ Generic Operations:
 *    - SEBELUM: Manual delete dengan multiple steps
 *    - SESUDAH: return this.deleteResource(id, this.prisma.course, '...');
 * 
 * 6. ✅ Code Reusability:
 *    - SEBELUM: Logic yang sama diulang di setiap service
 *    - SESUDAH: Logic common ada di base class, cukup extend
 * 
 * 7. ✅ Consistency:
 *    - SEBELUM: Pattern bisa berbeda antar service
 *    - SESUDAH: Semua service mengikuti pattern yang sama
 * 
 * 8. ✅ Maintenance:
 *    - SEBELUM: Perubahan harus dilakukan di banyak tempat
 *    - SESUDAH: Perubahan cukup di base class saja
 */
