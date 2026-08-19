import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CourseProgressResponse,
  ProgressBreakdown,
  StudentProgressListResponse,
} from './dto/course-progress.dto';
import { AutoValidator } from '../common/base/validation-guide';

@Injectable()
export class CourseProgressService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate progress for a specific student in a specific course
   * Progress is based on:
   * - Materials viewed/completed
   * - Assignments submitted
   * - Quizzes completed
   * - Exams completed
   * - Activities completed
   */
  async calculateStudentProgress(
    courseId: string,
    studentId: string,
  ): Promise<CourseProgressResponse> {
    // ✅ Validate UUIDs dengan AutoValidator
    const validatedCourseId = AutoValidator.validateUUID(courseId, 'Course ID');
    const validatedStudentId = AutoValidator.validateUUID(studentId, 'Student ID');

    const [course, student] = await Promise.all([
      this.prisma.course.findUnique({
        where: { id: validatedCourseId },
        select: {
          id: true,
          name: true,
          code: true,
        },
      }),
      this.prisma.user.findUnique({
        where: { id: validatedStudentId },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    if (!course || !student) {
      throw new Error('Course or student not found');
    }

    // Get all course content
    const [modules, assignments, exams, activities] = await Promise.all([
      this.prisma.module.findMany({
        where: { courseId: validatedCourseId },
        include: { files: true },
      }),
      this.prisma.assignment.findMany({ where: { courseId: validatedCourseId } }),
      this.prisma.exam.findMany({ where: { courseId: validatedCourseId } }),
      this.prisma.activity.findMany({
        where: { week: { courseId: validatedCourseId } },
      }),
    ]);

    // Get student's completion data
    const [
      assignmentSubmissions,
      examAttempts,
      activityLogs,
    ] = await Promise.all([
      this.prisma.assignmentSubmission.findMany({
        where: {
          assignmentId: { in: assignments.map((a) => a.id) },
          studentId: validatedStudentId,
          status: { in: ['SUBMITTED', 'LATE', 'GRADED'] },
        },
      }),
      this.prisma.examAttempt.findMany({
        where: {
          examId: { in: exams.map((e) => e.id) },
          studentId: validatedStudentId,
          status: { in: ['SUBMITTED', 'GRADED'] },
        },
      }),
      this.prisma.activityLog.findMany({
        where: {
          userId: validatedStudentId,
          entity: { in: ['Module', 'Activity'] },
          entityId: { in: [...modules.map((m) => m.id), ...activities.map((a) => a.id)] },
        },
      }),
    ]);

    // Calculate breakdown
    const breakdown = this.calculateProgressBreakdown(
      modules,
      assignments,
      exams,
      activities,
      assignmentSubmissions,
      examAttempts,
      activityLogs,
    );

    // Calculate overall progress
    const totalItems =
      breakdown.materialsTotal +
      breakdown.assignmentsTotal +
      breakdown.quizzesTotal +
      breakdown.examsTotal +
      breakdown.activitiesTotal;

    const completedItems =
      breakdown.materialsCompleted +
      breakdown.assignmentsCompleted +
      breakdown.quizzesCompleted +
      breakdown.examsCompleted +
      breakdown.activitiesCompleted;

    const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Update grade record with completion percentage
    await this.updateGradeCompletion(validatedCourseId, validatedStudentId, overallProgress);

    return {
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
      studentId: student.id,
      studentName: student.name,
      overallProgress: Math.round(overallProgress * 100) / 100,
      breakdown,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get progress for all students in a course (for lecturers)
   */
  async getCourseStudentsProgress(
    courseId: string,
  ): Promise<StudentProgressListResponse> {
    // ✅ Validate courseId dengan AutoValidator
    const validatedCourseId = AutoValidator.validateUUID(courseId, 'Course ID');

    const course = await this.prisma.course.findUnique({
      where: { id: validatedCourseId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: validatedCourseId, role: 'STUDENT' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const studentsProgress = await Promise.all(
      enrollments.map((enrollment) =>
        this.calculateStudentProgress(validatedCourseId, enrollment.user.id),
      ),
    );

    const averageProgress =
      studentsProgress.length > 0
        ? studentsProgress.reduce((sum, p) => sum + p.overallProgress, 0) / studentsProgress.length
        : 0;

    const atRiskStudents = studentsProgress.filter(
      (p) => p.overallProgress < 50,
    ).length;

    return {
      courseId: course.id,
      courseName: course.name,
      students: studentsProgress,
      averageProgress: Math.round(averageProgress * 100) / 100,
      atRiskStudents,
    };
  }

  /**
   * Get progress for a student across all their courses (for students)
   */
  async getStudentAllCoursesProgress(
    studentId: string,
  ): Promise<CourseProgressResponse[]> {
    // ✅ Validate studentId dengan AutoValidator
    const validatedStudentId = AutoValidator.validateUUID(studentId, 'Student ID');

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: validatedStudentId, role: 'STUDENT' },
      select: { courseId: true },
    });

    const courseIds = enrollments.map((e) => e.courseId);

    const progressList = await Promise.all(
      courseIds.map((courseId) =>
        this.calculateStudentProgress(courseId, validatedStudentId),
      ),
    );

    return progressList;
  }

  /**
   * Recalculate progress for a course (optionally for a specific student)
   */
  async recalculateProgress(
    courseId: string,
    studentId?: string,
  ): Promise<{ message: string; updated: number }> {
    // ✅ Validate courseId dengan AutoValidator
    const validatedCourseId = AutoValidator.validateUUID(courseId, 'Course ID');

    if (studentId) {
      // ✅ Validate studentId dengan AutoValidator
      const validatedStudentId = AutoValidator.validateUUID(studentId, 'Student ID');
      await this.calculateStudentProgress(validatedCourseId, validatedStudentId);
      return {
        message: 'Progress recalculated for student',
        updated: 1,
      };
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: validatedCourseId, role: 'STUDENT' },
      select: { userId: true },
    });

    await Promise.all(
      enrollments.map((enrollment) =>
        this.calculateStudentProgress(validatedCourseId, enrollment.userId),
      ),
    );

    return {
      message: 'Progress recalculated for all students in course',
      updated: enrollments.length,
    };
  }

  /**
   * Get system-wide progress statistics (for admins)
   */
  async getSystemProgressStats() {
    const [totalEnrollments, grades] = await Promise.all([
      this.prisma.enrollment.count({ where: { role: 'STUDENT' } }),
      this.prisma.grade.findMany({
        select: {
          completionPercentage: true,
          finalScore: true,
          passed: true,
        },
      }),
    ]);

    const averageProgress =
      grades.length > 0
        ? grades.reduce((sum: number, g: any) => sum + g.completionPercentage, 0) / grades.length
        : 0;

    const passedCount = grades.filter((g: any) => g.passed === true).length;
    const passRate = grades.length > 0 ? (passedCount / grades.length) * 100 : 0;

    const atRiskStudents = grades.filter((g: any) => g.completionPercentage < 50).length;

    return {
      totalEnrollments,
      averageProgress: Math.round(averageProgress * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      atRiskStudents,
      completedCourses: grades.filter((g: any) => g.completionPercentage === 100).length,
    };
  }

  /**
   * Calculate detailed progress breakdown
   */
  private calculateProgressBreakdown(
    modules: any[],
    assignments: any[],
    exams: any[],
    activities: any[],
    assignmentSubmissions: any[],
    examAttempts: any[],
    activityLogs: any[],
  ): ProgressBreakdown {
    // Materials progress (based on activity logs viewing modules)
    const viewedModuleIds = new Set(
      activityLogs
        .filter((log) => log.entity === 'Module')
        .map((log) => log.entityId),
    );
    const materialsCompleted = viewedModuleIds.size;
    const materialsTotal = modules.length;

    // Assignments progress
    const submittedAssignmentIds = new Set(
      assignmentSubmissions.map((s) => s.assignmentId),
    );
    const assignmentsCompleted = submittedAssignmentIds.size;
    const assignmentsTotal = assignments.length;

    // Quizzes progress (exams with category QUIZ)
    const quizzes = exams.filter((e) => e.category === 'QUIZ');
    const submittedQuizIds = new Set(
      examAttempts
        .filter((a) => quizzes.some((q) => q.id === a.examId))
        .map((a) => a.examId),
    );
    const quizzesCompleted = submittedQuizIds.size;
    const quizzesTotal = quizzes.length;

    // Exams progress (UTS, UAS, GENERAL)
    const otherExams = exams.filter((e) => e.category !== 'QUIZ');
    const submittedExamIds = new Set(
      examAttempts
        .filter((a) => otherExams.some((e) => e.id === a.examId))
        .map((a) => a.examId),
    );
    const examsCompleted = submittedExamIds.size;
    const examsTotal = otherExams.length;

    // Activities progress
    const completedActivityIds = new Set(
      activityLogs
        .filter((log) => log.entity === 'Activity')
        .map((log) => log.entityId),
    );
    const activitiesCompleted = completedActivityIds.size;
    const activitiesTotal = activities.length;

    return {
      materialsCompleted,
      materialsTotal,
      assignmentsCompleted,
      assignmentsTotal,
      quizzesCompleted,
      quizzesTotal,
      examsCompleted,
      examsTotal,
      activitiesCompleted,
      activitiesTotal,
    };
  }

  /**
   * Update grade record with completion percentage
   */
  private async updateGradeCompletion(
    courseId: string,
    studentId: string,
    completionPercentage: number,
  ): Promise<void> {
    // ✅ Validate UUIDs dan number dengan AutoValidator
    const validatedCourseId = AutoValidator.validateUUID(courseId, 'Course ID');
    const validatedStudentId = AutoValidator.validateUUID(studentId, 'Student ID');
    const validatedPercentage = AutoValidator.validateNumber(completionPercentage, 'Completion percentage', 0, 100);

    const grade = await this.prisma.grade.findUnique({
      where: {
        courseId_studentId: {
          courseId: validatedCourseId,
          studentId: validatedStudentId,
        },
      },
    });

    if (grade) {
      await this.prisma.grade.update({
        where: { id: grade.id },
        data: {
          completionPercentage: validatedPercentage,
          calculatedAt: new Date(),
        },
      });
    } else {
      await this.prisma.grade.create({
        data: {
          courseId: validatedCourseId,
          studentId: validatedStudentId,
          completionPercentage: validatedPercentage,
          calculatedAt: new Date(),
        },
      });
    }
  }
}
