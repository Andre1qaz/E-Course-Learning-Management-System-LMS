import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { Role, AssignmentSubmissionStatus } from '@prisma/client';
import { CalendarService } from '../calendar/calendar.service';
import { NotificationsQueueService } from '../notifications/notifications-queue.service';
import { AutoValidator } from '../common/base/validation-guide';

// Heuristic #1: Visibility of System Status — clear success/error messages
// Heuristic #5: Error Prevention — validate permissions and data before operations
// Heuristic #16: Instructional Assessment — detailed grading with feedback
// Heuristic #18: Consistency and Standards — consistent status tracking

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private calendarService: CalendarService,
    private notificationsQueueService: NotificationsQueueService,
  ) {}

  /**
   * Create a new assignment (Admin or course instructor only)
   * Heuristic #16: Instructional Assessment — require maxScore for grading
   * ✅ MENGGUNAKAN AutoValidator untuk otomatis format handling
   */
  async create(
    courseId: string,
    userId: string,
    userRole: Role,
    dto: CreateAssignmentDto,
  ) {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      title: { type: 'string', required: true, maxLength: 200 },
      description: { type: 'string', required: false, maxLength: 2000 },
      deadline: { type: 'date', required: true },
      maxScore: { type: 'number', required: true, min: 0, max: 1000 },
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
        'Only Admin and course instructor can create assignments',
      );
    }

    // ✅ Create dengan data yang sudah divalidasi
    const assignment = await this.prisma.assignment.create({
      data: {
        courseId: validatedCourseId,
        title: result.sanitized.title,
        description: result.sanitized.description,
        deadline: result.sanitized.deadline,
        maxScore: result.sanitized.maxScore,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Automatically create calendar event
    await this.calendarService.createEventFromAssignment(assignment.id);

    // Send notifications to enrolled students via queue
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: validatedCourseId },
      select: { userId: true },
    });

    const studentIds = enrollments.map((e: any) => e.userId);
    await this.notificationsQueueService.addBulkNotificationJob({
      userIds: studentIds,
      type: 'ASSIGNMENT_CREATED',
      title: 'Tugas Baru Ditambahkan',
      message: `Tugas "${assignment.title}" telah ditambahkan di course "${course.name}". Deadline: ${result.sanitized.deadline.toLocaleDateString('id-ID')}`,
      link: `/mahasiswa/courses/${validatedCourseId}/assignments/${assignment.id}`,
    });

    return {
      success: true,
      data: assignment,
      message: 'Assignment created successfully',
    };
  }

  /**
   * Get assignment by ID
   */
  async findOne(id: string, userId: string, userRole: Role) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true } },
            enrollments: true,
          },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check access permissions
    const hasAccess =
      userRole === Role.ADMIN ||
      assignment.course.instructorId === userId ||
      assignment.course.enrollments.some((e: any) => e.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this assignment');
    }

    return {
      success: true,
      data: assignment,
      message: 'Assignment retrieved successfully',
    };
  }

  /**
   * Update assignment (Admin or course instructor only)
   * ✅ MENGGUNAKAN AutoValidator untuk otomatis format handling
   */
  async update(
    id: string,
    userId: string,
    userRole: Role,
    dto: UpdateAssignmentDto,
  ) {
    // ✅ Auto-validation untuk field yang di-update
    const result = AutoValidator.validateObject(dto, {
      title: { type: 'string', required: false, maxLength: 200 },
      description: { type: 'string', required: false, maxLength: 2000 },
      deadline: { type: 'date', required: false },
      maxScore: { type: 'number', required: false, min: 0, max: 1000 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate assignment ID
    const validatedId = AutoValidator.validateUUID(id, 'Assignment ID');

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: validatedId },
      include: {
        course: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && assignment.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only Admin and course instructor can update this assignment',
      );
    }

    // ✅ Update dengan data yang sudah divalidasi
    const updatedAssignment = await this.prisma.assignment.update({
      where: { id: validatedId },
      data: result.sanitized,
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.calendarService.createEventFromAssignment(updatedAssignment.id);

    if (result.sanitized.deadline) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId: assignment.courseId },
        select: { userId: true },
      });
      await this.notificationsQueueService.addBulkNotificationJob({
        userIds: enrollments.map((e) => e.userId),
        type: 'SCHEDULE_CHANGED',
        title: 'Perubahan Deadline Tugas',
        message: `Deadline tugas "${updatedAssignment.title}" diubah menjadi ${result.sanitized.deadline.toLocaleDateString('id-ID')}`,
        link: `/mahasiswa/courses/${assignment.courseId}/assignments/${validatedId}`,
      });
    }

    return {
      success: true,
      data: updatedAssignment,
      message: 'Assignment updated successfully',
    };
  }

  /**
   * Delete assignment (Admin or course instructor only)
   * Heuristic #3: User Control and Freedom — allow deletion with proper checks
   */
  async remove(id: string, userId: string, userRole: Role) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        course: true,
        submissions: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && assignment.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only Admin and course instructor can delete this assignment',
      );
    }

    // Delete submissions
    await this.prisma.assignmentSubmission.deleteMany({
      where: { assignmentId: id },
    });

    await this.prisma.assignment.delete({
      where: { id },
    });

    return {
      success: true,
      data: null,
      message: 'Assignment deleted successfully',
    };
  }

  /**
   * Get all assignments for a course
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

    const assignments = await this.prisma.assignment.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { deadline: 'asc' },
    });

    return {
      success: true,
      data: assignments,
      message: 'Assignments retrieved successfully',
    };
  }

  /**
   * Submit assignment (Students only)
   * Heuristic #18: Consistency and Standards — track submission status
   */
  async submit(
    assignmentId: string,
    userId: string,
    fileUrl: string,
    fileName: string,
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          include: {
            enrollments: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if student is enrolled
    const isEnrolled = assignment.course.enrollments.some(
      (e: any) => e.userId === userId,
    );
    if (!isEnrolled) {
      throw new ForbiddenException(
        'You must be enrolled in this course to submit assignments',
      );
    }

    // Check if already submitted
    const existingSubmission =
      await this.prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId: userId,
          },
        },
      });

    if (existingSubmission) {
      throw new ForbiddenException(
        'You have already submitted this assignment',
      );
    }

    // Check deadline
    if (new Date() > assignment.deadline) {
      throw new ForbiddenException('Assignment deadline has passed');
    }

    const submission = await this.prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: userId,
        fileUrl,
        fileName,
        status: AssignmentSubmissionStatus.SUBMITTED,
      },
      include: {
        assignment: {
          select: {
            title: true,
            maxScore: true,
          },
        },
      },
    });

    return {
      success: true,
      data: submission,
      message: 'Assignment submitted successfully',
    };
  }

  /**
   * Grade assignment submission (Admin or course instructor only)
   * Heuristic #16: Instructional Assessment — detailed feedback
   */
  async grade(
    submissionId: string,
    userId: string,
    userRole: Role,
    dto: GradeAssignmentDto,
  ) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Check permissions
    if (
      userRole !== Role.ADMIN &&
      submission.assignment.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'Only Admin and course instructor can grade submissions',
      );
    }

    // Validate score if provided
    if (dto.score !== undefined && dto.score > submission.assignment.maxScore) {
      throw new ForbiddenException(
        `Score cannot exceed maximum score of ${submission.assignment.maxScore}`,
      );
    }

    const gradedSubmission = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        rubricNotes: dto.rubricNotes,
        status:
          dto.score !== undefined
            ? AssignmentSubmissionStatus.GRADED
            : AssignmentSubmissionStatus.SUBMITTED,
      },
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
        assignment: {
          select: {
            title: true,
            maxScore: true,
          },
        },
      },
    });

    return {
      success: true,
      data: gradedSubmission,
      message: 'Assignment graded successfully',
    };
  }

  /**
   * Get all submissions for an assignment (Admin or course instructor only)
   */
  async getSubmissions(assignmentId: string, userId: string, userRole: Role) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && assignment.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only Admin and course instructor can view all submissions',
      );
    }

    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        rubricAssessments: {
          include: {
            criterion: {
              include: {
                levels: true,
              },
            },
            level: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return {
      success: true,
      data: submissions,
      message: 'Submissions retrieved successfully',
    };
  }

  /**
   * Get student's submission for an assignment
   */
  async getStudentSubmission(assignmentId: string, userId: string) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: userId,
        },
      },
      include: {
        assignment: {
          select: {
            title: true,
            maxScore: true,
            deadline: true,
          },
        },
      },
    });

    if (!submission) {
      return {
        success: true,
        data: null,
        message: 'No submission found',
      };
    }

    return {
      success: true,
      data: submission,
      message: 'Submission retrieved successfully',
    };
  }

  /**
   * Get gradebook for a course (Admin or course instructor only)
   * Heuristic #16: Instructional Assessment — comprehensive gradebook view
   */
  async getGradebook(courseId: string, userId: string, userRole: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        assignments: {
          orderBy: { deadline: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only Admin and course instructor can view gradebook',
      );
    }

    // Get all submissions for this course
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: {
        assignment: {
          courseId,
        },
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Build gradebook matrix
    const gradebook = course.enrollments.map((enrollment: any) => {
      const studentSubmissions = submissions.filter(
        (s: any) => s.studentId === enrollment.userId,
      );

      const grades = course.assignments.map((assignment: any) => {
        const submission = studentSubmissions.find(
          (s: any) => s.assignmentId === assignment.id,
        );

        return {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          maxScore: assignment.maxScore,
          score: submission?.score || null,
          status: submission?.status || null,
          submittedAt: submission?.submittedAt || null,
        };
      });

      const totalScore = grades.reduce(
        (sum: number, g: any) => sum + (g.score || 0),
        0,
      );
      const maxTotalScore = grades.reduce(
        (sum: number, g: any) => sum + g.maxScore,
        0,
      );

      return {
        student: enrollment.user,
        grades,
        totalScore,
        maxTotalScore,
        average: maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0,
      };
    });

    return {
      success: true,
      data: {
        course: {
          id: course.id,
          name: course.name,
        },
        assignments: course.assignments,
        gradebook,
      },
      message: 'Gradebook retrieved successfully',
    };
  }
}
