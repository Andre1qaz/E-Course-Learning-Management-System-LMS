import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { EnrollCourseDto } from './dto/enroll-course.dto';
import { DirectEnrollDto } from './dto/direct-enroll.dto';
import { UpdateEnrollmentKeyDto } from './dto/update-enrollment-key.dto';
import { Role, EnrollmentRole } from '@prisma/client';

// Heuristic #1: Visibility of System Status — clear success/error messages
// Heuristic #5: Error Prevention — validate permissions and data before operations
// Heuristic #9: Help Users Recognize, Diagnose, and Recover from Errors — specific error messages

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new course (Admin or Dosen only)
   * Heuristic #5: Error Prevention — validate instructor exists
   */
  async create(userId: string, userRole: Role, dto: CreateCourseDto) {
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can create courses');
    }

    // Check if course code already exists
    const existingCourse = await this.prisma.course.findUnique({
      where: { code: dto.code },
    });

    if (existingCourse) {
      throw new ConflictException('Course code already exists');
    }

    // Validate category if provided (filter out empty strings)
    const categoryId = dto.categoryId && dto.categoryId.trim() !== '' ? dto.categoryId : undefined;
    
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

    return {
      success: true,
      data: course,
      message: 'Course created successfully',
    };
  }

  /**
   * Get course by ID
   * Heuristic #6: Recognition Rather Than Recall — provide full course details
   */
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

    return {
      success: true,
      data,
      message: 'Course retrieved successfully',
    };
  }

  /**
   * Update course (Admin or course instructor only)
   * Heuristic #3: User Control and Freedom — allow editing course details
   */
  async update(id: string, userId: string, userRole: Role, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can update this course');
    }

    // Validate category if provided (filter out empty strings)
    const categoryId = dto.categoryId !== undefined ? (dto.categoryId && dto.categoryId.trim() !== '' ? dto.categoryId : null) : undefined;
    
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

    return {
      success: true,
      data: updatedCourse,
      message: 'Course updated successfully',
    };
  }

  /**
   * Delete course (Admin or course instructor only)
   * Heuristic #3: User Control and Freedom — allow deletion with proper checks
   */
  async remove(id: string, userId: string, userRole: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id },
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
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can delete this course');
    }

    // Prevent deletion if course has active enrollments (optional safety check)
    if (course._count.enrollments > 0 && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Cannot delete course with active enrollments. Contact Admin.');
    }

    await this.prisma.course.delete({
      where: { id },
    });

    return {
      success: true,
      data: null,
      message: 'Course deleted successfully',
    };
  }

  /**
   * Enroll in course using enrollment code
   * Heuristic #5: Error Prevention — validate enrollment code and prevent duplicates
   */
  async enroll(userId: string, dto: EnrollCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { enrollmentCode: dto.enrollmentCode },
      include: {
        enrollments: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Invalid enrollment code');
    }

    // Check if enrollment is enabled
    if (!course.enrollmentEnabled) {
      throw new ForbiddenException('Enrollment is disabled for this course');
    }

    // Check if already enrolled
    const existingEnrollment = course.enrollments.find((e: any) => e.userId === userId);
    if (existingEnrollment) {
      throw new ForbiddenException('You are already enrolled in this course');
    }

    await this.prisma.enrollment.create({
      data: {
        userId,
        courseId: course.id,
      },
    });

    return {
      success: true,
      data: { courseId: course.id, courseName: course.name },
      message: 'Successfully enrolled in course',
    };
  }

  /**
   * Unenroll from course
   * Heuristic #3: User Control and Freedom — allow students to leave courses
   */
  async unenroll(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    await this.prisma.enrollment.delete({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    return {
      success: true,
      data: null,
      message: 'Successfully unenrolled from course',
    };
  }

  /**
   * Get all courses with filtering
   * Heuristic #7: Flexibility and Efficiency of Use — search and filter options
   */
  async findAll(userId: string, userRole: Role, filters?: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
  }) {
    const where: any = {};

    // Apply role-based filtering
    if (userRole === Role.ADMIN) {
      // Admin sees all courses
    } else if (userRole === Role.DOSEN) {
      where.instructorId = userId;
    } else {
      // Students only see enrolled courses
      where.enrollments = { some: { userId } };
    }

    // Apply additional filters
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const courses = await this.prisma.course.findMany({
      where,
      include: {
        category: true,
        instructor: { select: { id: true, name: true } },
        _count: {
          select: {
            modules: true,
            assignments: true,
            exams: true,
            enrollments: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      success: true,
      data: courses,
      message: 'Courses retrieved successfully',
    };
  }

  /**
   * Generate unique enrollment code
   * Heuristic #5: Error Prevention — ensure uniqueness
   */
  private generateEnrollmentCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Direct enrollment by Admin or Lecturer
   * Heuristic #5: Error Prevention — validate permissions and prevent duplicates
   */
  async directEnroll(courseId: string, userId: string, userRole: Role, dto: DirectEnrollDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can enroll students directly');
    }

    // Validate target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if target user is a student
    if (targetUser.role !== Role.MAHASISWA) {
      throw new ForbiddenException('Only students can be enrolled in courses');
    }

    // Check if already enrolled
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: dto.userId, courseId },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('User is already enrolled in this course');
    }

    await this.prisma.enrollment.create({
      data: {
        userId: dto.userId,
        courseId,
        role: dto.role,
      },
    });

    return {
      success: true,
      data: { courseId, userId: dto.userId, userName: targetUser.name },
      message: 'Student enrolled successfully',
    };
  }

  /**
   * Update enrollment key (code or enable/disable)
   * Heuristic #5: Error Prevention — validate permissions and ensure uniqueness
   */
  async updateEnrollmentKey(courseId: string, userId: string, userRole: Role, dto: UpdateEnrollmentKeyDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can update enrollment key');
    }

    const updateData: any = {};

    if (dto.enrollmentCode !== undefined) {
      // Check if new code conflicts with existing course
      const existingCourse = await this.prisma.course.findUnique({
        where: { enrollmentCode: dto.enrollmentCode },
      });

      if (existingCourse && existingCourse.id !== courseId) {
        throw new ConflictException('Enrollment code already exists');
      }

      updateData.enrollmentCode = dto.enrollmentCode;
    }

    if (dto.enrollmentEnabled !== undefined) {
      updateData.enrollmentEnabled = dto.enrollmentEnabled;
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: updateData,
    });

    return {
      success: true,
      data: {
        enrollmentCode: updatedCourse.enrollmentCode,
        enrollmentEnabled: updatedCourse.enrollmentEnabled,
      },
      message: 'Enrollment key updated successfully',
    };
  }

  /**
   * Get all participants of a course
   * Heuristic #6: Recognition Rather Than Recall — provide full participant details
   */
  async getParticipants(courseId: string, userId: string, userRole: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can view participants');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const participants = enrollments.map((enrollment) => ({
      id: enrollment.id,
      userId: enrollment.userId,
      userName: enrollment.user.name,
      userEmail: enrollment.user.email,
      role: enrollment.role,
      joinedAt: enrollment.joinedAt,
    }));

    return {
      success: true,
      data: {
        courseId,
        courseName: course.name,
        totalParticipants: participants.length,
        participants,
      },
      message: 'Participants retrieved successfully',
    };
  }

  /**
   * Remove a participant from course
   * Heuristic #3: User Control and Freedom — allow removal with proper checks
   */
  async removeParticipant(courseId: string, participantId: string, userId: string, userRole: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can remove participants');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: participantId },
    });

    if (!enrollment || enrollment.courseId !== courseId) {
      throw new NotFoundException('Enrollment not found');
    }

    await this.prisma.enrollment.delete({
      where: { id: participantId },
    });

    return {
      success: true,
      data: null,
      message: 'Participant removed successfully',
    };
  }
}
