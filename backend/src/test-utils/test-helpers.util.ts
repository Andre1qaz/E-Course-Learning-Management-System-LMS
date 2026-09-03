import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Test helper utilities for backend testing
 */
export class TestHelpers {
  static async createTestUser(
    prisma: PrismaService,
    overrides: {
      email?: string;
      name?: string;
      role?: Role;
      password?: string;
    } = {},
  ) {
    const hashedPassword = await bcrypt.hash(
      overrides.password || 'TestPassword123',
      12,
    );

    return prisma.user.create({
      data: {
        email: overrides.email || `test-${Date.now()}@example.com`,
        name: overrides.name || 'Test User',
        password: hashedPassword,
        role: overrides.role || Role.MAHASISWA,
      },
    });
  }

  static async createTestCourse(
    prisma: PrismaService,
    instructorId: string,
    overrides: {
      name?: string;
      code?: string;
      description?: string;
      thumbnailColor?: string;
      categoryId?: string;
    } = {},
  ) {
    return prisma.course.create({
      data: {
        name: overrides.name || 'Test Course',
        code: overrides.code || `TEST${Date.now()}`,
        description: overrides.description || 'Test course description',
        thumbnailColor: overrides.thumbnailColor || '#1a365d',
        instructorId,
        categoryId: overrides.categoryId,
        enrollmentCode: this.generateEnrollmentCode(),
      },
    });
  }

  static async createTestCategory(
    prisma: PrismaService,
    overrides: {
      name?: string;
      academicYear?: string;
    } = {},
  ) {
    return prisma.courseCategory.create({
      data: {
        name: overrides.name || 'Test Category',
        academicYear: overrides.academicYear || '2024-2025',
      },
    });
  }

  static async createTestEnrollment(
    prisma: PrismaService,
    userId: string,
    courseId: string,
    role: 'STUDENT' | 'ASSISTANT' = 'STUDENT',
  ) {
    return prisma.enrollment.create({
      data: {
        userId,
        courseId,
        role,
      },
    });
  }

  static async createTestModule(
    prisma: PrismaService,
    courseId: string,
    overrides: {
      title?: string;
      description?: string;
      order?: number;
    } = {},
  ) {
    return prisma.module.create({
      data: {
        courseId,
        title: overrides.title || 'Test Module',
        description: overrides.description || 'Test module description',
        order: overrides.order || 1,
      },
    });
  }

  static async createTestActivity(
    prisma: PrismaService,
    weekId: string,
    overrides: {
      type?:
        | 'VIDEO'
        | 'MATERIAL'
        | 'ASSIGNMENT'
        | 'QUIZ'
        | 'FORUM'
        | 'EXTERNAL_LINK';
      title?: string;
      description?: string;
      status?: 'DRAFT' | 'PUBLISHED';
      order?: number;
    } = {},
  ) {
    return prisma.activity.create({
      data: {
        weekId,
        type: overrides.type || 'MATERIAL',
        title: overrides.title || 'Test Activity',
        description: overrides.description || 'Test activity description',
        status: overrides.status || 'DRAFT',
        order: overrides.order || 1,
      },
    });
  }

  static async createTestWeek(
    prisma: PrismaService,
    courseId: string,
    overrides: {
      weekNumber?: number;
      title?: string;
      startDate?: Date;
      endDate?: Date;
      order?: number;
    } = {},
  ) {
    const now = new Date();
    return prisma.week.create({
      data: {
        courseId,
        weekNumber: overrides.weekNumber || 1,
        title: overrides.title || 'Week 1',
        startDate: overrides.startDate || now,
        endDate:
          overrides.endDate ||
          new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        order: overrides.order || 1,
      },
    });
  }

  static async createTestAnnouncement(
    prisma: PrismaService,
    authorId: string,
    courseId?: string,
    overrides: {
      title?: string;
      content?: string;
      priority?: string;
      isPublished?: boolean;
    } = {},
  ) {
    return prisma.announcement.create({
      data: {
        title: overrides.title || 'Test Announcement',
        content: overrides.content || 'Test announcement content',
        priority: overrides.priority || 'NORMAL',
        isPublished: overrides.isPublished ?? true,
        authorId,
        courseId,
      },
    });
  }

  static async cleanupDatabase(prisma: PrismaService) {
    // Delete in order of dependencies to avoid foreign key constraints
    await prisma.activityLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.forumMention.deleteMany();
    await prisma.forumAttachment.deleteMany();
    await prisma.forumReply.deleteMany();
    await prisma.forumThread.deleteMany();
    await prisma.answer.deleteMany();
    await prisma.examAttempt.deleteMany();
    await prisma.questionTag.deleteMany();
    await prisma.questionOption.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.assignmentSubmission.deleteMany();
    await prisma.rubricAssessment.deleteMany();
    await prisma.rubricCriterionLevel.deleteMany();
    await prisma.rubricCriterion.deleteMany();
    await prisma.rubric.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.week.deleteMany();
    await prisma.moduleFile.deleteMany();
    await prisma.module.deleteMany();
    await prisma.calendarEvent.deleteMany();
    await prisma.announcementRead.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.gradeHistory.deleteMany();
    await prisma.grade.deleteMany();
    await prisma.courseSettings.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.questionBank.deleteMany();
    await prisma.course.deleteMany();
    await prisma.courseCategory.deleteMany();
    await prisma.privateFile.deleteMany();
    await prisma.user.deleteMany();
  }

  private static generateEnrollmentCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  static async generateTestToken(userId: string, email: string, role: Role) {
    // This is a simplified token generation for testing
    // In real tests, you would use the JWT service
    return Buffer.from(JSON.stringify({ sub: userId, email, role })).toString(
      'base64',
    );
  }
}
