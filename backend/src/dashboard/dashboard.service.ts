import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseProgressService } from '../course-progress/course-progress.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private courseProgressService: CourseProgressService,
  ) {}

  /**
   * Get administrator dashboard statistics
   * - Total course
   * - Total mahasiswa
   * - Total dosen
   * - Total assignment
   * - Total quiz
   * - Total course aktif
   * - Jumlah pengguna aktif
   * - Aktivitas terbaru
   */
  async getAdminStats() {
    const [
      totalCourses,
      totalStudents,
      totalLecturers,
      totalAssignments,
      totalQuizzes,
      activeCourses,
      activeUsers,
      recentActivities,
    ] = await Promise.all([
      this.prisma.course.count(),
      this.prisma.user.count({ where: { role: 'MAHASISWA' } }),
      this.prisma.user.count({ where: { role: 'DOSEN' } }),
      this.prisma.assignment.count(),
      this.prisma.exam.count({ where: { category: 'QUIZ' } }),
      this.prisma.course.count({ where: { isActive: true } }),
      this.getActiveUsersCount(),
      this.prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalCourses,
        totalStudents,
        totalLecturers,
        totalAssignments,
        totalQuizzes,
        activeCourses,
        activeUsers,
        recentActivities: recentActivities.map((activity) => ({
          id: activity.id,
          action: activity.action,
          entity: activity.entity,
          entityId: activity.entityId,
          metadata: activity.metadata,
          createdAt: activity.createdAt,
          user: activity.user,
        })),
      },
      message: 'Admin dashboard statistics retrieved successfully',
    };
  }

  /**
   * Get lecturer dashboard statistics
   * - Jumlah course yang diajar
   * - Jumlah mahasiswa pada seluruh course
   * - Assignment yang masih aktif
   * - Assignment yang belum dinilai
   * - Quiz yang sedang berlangsung
   * - Aktivitas terbaru pada course yang diajarkan
   */
  async getLecturerStats(userId: string) {
    const lecturerCourses = await this.prisma.course.findMany({
      where: { instructorId: userId },
      select: { id: true },
    });

    const courseIds = lecturerCourses.map((c) => c.id);

    const [
      totalCourses,
      totalStudents,
      activeAssignments,
      ungradedAssignments,
      ongoingQuizzes,
      recentActivities,
    ] = await Promise.all([
      this.prisma.course.count({ where: { instructorId: userId } }),
      this.prisma.enrollment.count({
        where: { courseId: { in: courseIds } },
      }),
      this.prisma.assignment.count({
        where: {
          courseId: { in: courseIds },
          deadline: { gte: new Date() },
        },
      }),
      this.prisma.assignmentSubmission.count({
        where: {
          assignment: {
            courseId: { in: courseIds },
          },
          status: { in: ['SUBMITTED', 'LATE'] },
          score: null,
        },
      }),
      this.prisma.exam.count({
        where: {
          courseId: { in: courseIds },
          category: 'QUIZ',
          startTime: { lte: new Date() },
          deadline: { gte: new Date() },
          isPublished: true,
        },
      }),
      this.prisma.activityLog.findMany({
        where: {
          OR: [
            { entity: 'Course', entityId: { in: courseIds } },
            { entity: 'Assignment', entityId: { in: courseIds } },
            { entity: 'Exam', entityId: { in: courseIds } },
          ],
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalCourses,
        totalStudents,
        activeAssignments,
        ungradedAssignments,
        ongoingQuizzes,
        recentActivities: recentActivities.map((activity) => ({
          id: activity.id,
          action: activity.action,
          entity: activity.entity,
          entityId: activity.entityId,
          metadata: activity.metadata,
          createdAt: activity.createdAt,
          user: activity.user,
        })),
      },
      message: 'Lecturer dashboard statistics retrieved successfully',
    };
  }

  /**
   * Get student dashboard statistics
   * - Jumlah course yang diikuti
   * - Assignment yang belum diselesaikan
   * - Upcoming event
   * - Pengumuman terbaru
   * - Rata-rata nilai
   * - Progress pembelajaran
   * - Notifikasi aktivitas terbaru
   */
  async getStudentStats(userId: string) {
    const studentEnrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const courseIds = studentEnrollments.map((e) => e.courseId);

    const [
      totalCourses,
      incompleteAssignments,
      grades,
      unreadNotifications,
      courseProgressList,
    ] = await Promise.all([
      this.prisma.enrollment.count({ where: { userId } }),
      this.prisma.assignmentSubmission.count({
        where: {
          studentId: userId,
          assignment: {
            courseId: { in: courseIds },
            deadline: { gte: new Date() },
          },
          status: { in: ['NOT_SUBMITTED'] },
        },
      }),
      this.prisma.grade.findMany({
        where: {
          courseId: { in: courseIds },
          studentId: userId,
        },
        select: {
          finalScore: true,
          completionPercentage: true,
        },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
      this.courseProgressService.getStudentAllCoursesProgress(userId),
    ]);

    // Calculate average grade
    const validGrades = grades.filter((g: any) => g.finalScore !== null);
    const averageGrade =
      validGrades.length > 0
        ? validGrades.reduce((sum: number, g: any) => sum + (g.finalScore || 0), 0) / validGrades.length
        : 0;

    // Calculate average progress
    const averageProgress =
      grades.length > 0
        ? grades.reduce((sum: number, g: any) => sum + g.completionPercentage, 0) / grades.length
        : 0;

    return {
      success: true,
      data: {
        totalCourses,
        incompleteAssignments,
        upcomingEvents: [],
        recentAnnouncements: [],
        averageGrade,
        averageProgress,
        unreadNotifications,
        courseProgress: courseProgressList,
      },
      message: 'Student dashboard statistics retrieved successfully',
    };
  }

  /**
   * Get count of active users (users who logged in within the last 30 days)
   */
  private async getActiveUsersCount(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.prisma.user.count({
      where: {
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });
  }
}
