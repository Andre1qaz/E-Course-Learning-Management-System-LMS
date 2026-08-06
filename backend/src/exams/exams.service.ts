import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { Role, QuestionType, ExamAttemptStatus } from '@prisma/client';
import { CalendarService } from '../calendar/calendar.service';
import { NotificationsQueueService } from '../notifications/notifications-queue.service';

// Heuristic #1: Visibility of System Status — clear success/error messages
// Heuristic #5: Error Prevention — validate permissions and data before operations
// Heuristic #16: Instructional Assessment — detailed grading with feedback
// Heuristic #18: Consistency and Standards — consistent status tracking

@Injectable()
export class ExamsService {
  constructor(
    private prisma: PrismaService,
    private calendarService: CalendarService,
    private notificationsQueueService: NotificationsQueueService,
  ) {}

  /**
   * Create a new exam (Admin or course instructor only)
   * Heuristic #16: Instructional Assessment — require duration and maxScore
   */
  async create(courseId: string, userId: string, userRole: Role, dto: CreateExamDto) {
    // Check course access
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can create exams');
    }

    // Validate dates
    const startTime = new Date(dto.startTime);
    const deadline = new Date(dto.deadline);

    if (startTime >= deadline) {
      throw new BadRequestException('Start time must be before deadline');
    }

    const exam = await this.prisma.exam.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description,
        startTime,
        deadline,
        duration: dto.duration,
        isPublished: dto.isPublished || false,
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
    await this.calendarService.createEventFromExam(exam.id);

    // Send notifications to enrolled students if published via queue
    if (exam.isPublished) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId },
        select: { userId: true },
      });

      const studentIds = enrollments.map((e: any) => e.userId);
      await this.notificationsQueueService.addBulkNotificationJob({
        userIds: studentIds,
        type: 'EXAM_CREATED',
        title: 'Ujian Baru Dijadwalkan',
        message: `Ujian "${exam.title}" telah dijadwalkan di course "${course.name}". Mulai: ${startTime.toLocaleDateString('id-ID')} ${startTime.toLocaleTimeString('id-ID')}`,
        link: `/mahasiswa/courses/${courseId}/exams/${exam.id}`,
      });
    }

    return {
      success: true,
      data: exam,
      message: 'Exam created successfully',
    };
  }

  /**
   * Get exam by ID
   */
  async findOne(id: string, userId: string, userRole: Role) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true } },
            enrollments: true,
          },
        },
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check access permissions
    const hasAccess =
      userRole === Role.ADMIN ||
      exam.course.instructorId === userId ||
      exam.course.enrollments.some((e: any) => e.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this exam');
    }

    // Hide correct answers for students
    if (userRole === Role.MAHASISWA) {
      exam.questions = exam.questions.map((q: any) => ({
        ...q,
        options: q.options.map((o: any) => ({
          ...o,
          isCorrect: false,
        })),
      }));
    }

    return {
      success: true,
      data: exam,
      message: 'Exam retrieved successfully',
    };
  }

  /**
   * Update exam (Admin or course instructor only)
   */
  async update(id: string, userId: string, userRole: Role, dto: UpdateExamDto) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && exam.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can update this exam');
    }

    // Prevent editing if exam has attempts
    const hasAttempts = await this.prisma.examAttempt.findFirst({
      where: { examId: id, status: ExamAttemptStatus.SUBMITTED },
    });

    if (hasAttempts) {
      throw new BadRequestException('Cannot update exam that has been taken by students');
    }

    const updatedExam = await this.prisma.exam.update({
      where: { id },
      data: dto,
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.calendarService.createEventFromExam(updatedExam.id);

    if (dto.startTime || dto.deadline) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId: exam.courseId },
        select: { userId: true },
      });
      await this.notificationsQueueService.addBulkNotificationJob({
        userIds: enrollments.map((e) => e.userId),
        type: 'SCHEDULE_CHANGED',
        title: 'Perubahan Jadwal Ujian',
        message: `Jadwal ujian "${updatedExam.title}" telah diubah`,
        link: `/mahasiswa/courses/${exam.courseId}/exams/${id}`,
      });
    }

    return {
      success: true,
      data: updatedExam,
      message: 'Exam updated successfully',
    };
  }

  /**
   * Delete exam (Admin or course instructor only)
   * Heuristic #3: User Control and Freedom — allow deletion with proper checks
   */
  async remove(id: string, userId: string, userRole: Role) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        course: true,
        attempts: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && exam.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can delete this exam');
    }

    // Delete related data
    await this.prisma.answer.deleteMany({
      where: {
        attempt: { examId: id },
      },
    });

    await this.prisma.examAttempt.deleteMany({
      where: { examId: id },
    });

    await this.prisma.questionOption.deleteMany({
      where: {
        question: { examId: id },
      },
    });

    await this.prisma.question.deleteMany({
      where: { examId: id },
    });

    await this.prisma.exam.delete({
      where: { id },
    });

    return {
      success: true,
      data: null,
      message: 'Exam deleted successfully',
    };
  }

  /**
   * Publish exam (Admin or course instructor only)
   */
  async publish(id: string, userId: string, userRole: Role) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && exam.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can publish this exam');
    }

    // Check if exam has questions
    const questionCount = await this.prisma.question.count({
      where: { examId: id },
    });

    if (questionCount === 0) {
      throw new BadRequestException('Cannot publish exam without questions');
    }

    const publishedExam = await this.prisma.exam.update({
      where: { id },
      data: { isPublished: true },
    });

    return {
      success: true,
      data: publishedExam,
      message: 'Exam published successfully',
    };
  }

  /**
   * Get all exams for a course
   */
  async findByCourse(courseId: string, userId: string, userRole: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check access permissions
    const hasAccess =
      userRole === Role.ADMIN ||
      course.instructorId === userId ||
      course.enrollments.some((e: any) => e.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this course');
    }

    const exams = await this.prisma.exam.findMany({
      where: { courseId },
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
      success: true,
      data: exams,
      message: 'Exams retrieved successfully',
    };
  }

  /**
   * Get all exams for current user based on role
   */
  async findAll(userId: string, userRole: Role) {
    let where: any = {};

    if (userRole === Role.ADMIN) {
      // Admin sees all exams
      where = {};
    } else if (userRole === Role.DOSEN) {
      // Dosen sees exams from their courses
      const instructorCourses = await this.prisma.course.findMany({
        where: { instructorId: userId },
        select: { id: true },
      });
      where = { courseId: { in: instructorCourses.map((c) => c.id) } };
    } else {
      // Mahasiswa sees exams from enrolled courses
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId },
        select: { courseId: true },
      });
      where = { 
        courseId: { in: enrollments.map((e) => e.courseId) },
        isPublished: true
      };
    }

    const exams = await this.prisma.exam.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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
      success: true,
      data: exams,
      message: 'Exams retrieved successfully',
    };
  }

  /**
   * Add question to exam (Admin or course instructor only)
   */
  async addQuestion(examId: string, userId: string, userRole: Role, dto: CreateQuestionDto) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && exam.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can add questions');
    }

    // Prevent adding questions if exam has attempts
    const hasAttempts = await this.prisma.examAttempt.findFirst({
      where: { examId, status: ExamAttemptStatus.SUBMITTED },
    });

    if (hasAttempts) {
      throw new BadRequestException('Cannot add questions to exam that has been taken');
    }

    // Get next order
    const lastQuestion = await this.prisma.question.findFirst({
      where: { examId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = lastQuestion ? lastQuestion.order + 1 : 0;

    // Create question
    const question = await this.prisma.question.create({
      data: {
        examId,
        type: dto.type,
        questionText: dto.questionText,
        attachmentUrl: dto.attachmentUrl,
        points: dto.points,
        order: nextOrder,
        explanation: dto.explanation,
        rubric: dto.rubric,
        maxChars: dto.maxChars,
        caseSensitive: dto.caseSensitive,
        tolerance: dto.tolerance,
        allowMultiple: dto.allowMultiple,
      },
    });

    // Add options for multiple choice
    if (dto.type === QuestionType.MULTIPLE_CHOICE && dto.options) {
      for (let i = 0; i < dto.options.length; i++) {
        await this.prisma.questionOption.create({
          data: {
            questionId: question.id,
            optionText: dto.options[i].text,
            isCorrect: dto.options[i].isCorrect,
            order: i,
          },
        });
      }
    }

    return {
      success: true,
      data: question,
      message: 'Question added successfully',
    };
  }

  /**
   * Get all questions for an exam
   */
  async getQuestions(examId: string, userId: string, userRole: Role) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: {
          include: {
            enrollments: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check access permissions
    const hasAccess =
      userRole === Role.ADMIN ||
      exam.course.instructorId === userId ||
      exam.course.enrollments.some((e: any) => e.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this exam');
    }

    const questions = await this.prisma.question.findMany({
      where: { examId },
      include: {
        options: true,
      },
      orderBy: { order: 'asc' },
    });

    // Hide correct answers for students
    if (userRole === Role.MAHASISWA) {
      questions.forEach((q: any) => {
        q.options = q.options.map((o: any) => ({
          ...o,
          isCorrect: false,
        }));
      });
    }

    return {
      success: true,
      data: questions,
      message: 'Questions retrieved successfully',
    };
  }

  /**
   * Start exam attempt (Students only)
   * Heuristic #1: Visibility of System Status — track attempt status
   */
  async startAttempt(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: {
          include: {
            enrollments: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check if student is enrolled
    const isEnrolled = exam.course.enrollments.some((e: any) => e.userId === userId);
    if (!isEnrolled) {
      throw new ForbiddenException('You must be enrolled in this course to take the exam');
    }

    // Check if exam is published
    if (!exam.isPublished) {
      throw new ForbiddenException('This exam is not yet published');
    }

    // Check if exam is within time window
    const now = new Date();
    if (now < exam.startTime) {
      throw new ForbiddenException('Exam has not started yet');
    }
    if (now > exam.deadline) {
      throw new ForbiddenException('Exam deadline has passed');
    }

    // Check if student already has an attempt
    const existingAttempt = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId: userId,
      },
    });

    if (existingAttempt && existingAttempt.status === ExamAttemptStatus.SUBMITTED) {
      throw new ForbiddenException('You have already submitted this exam');
    }

    // Create or update attempt
    let attempt;
    if (existingAttempt) {
      attempt = await this.prisma.examAttempt.update({
        where: { id: existingAttempt.id },
        data: {
          status: ExamAttemptStatus.IN_PROGRESS,
          startedAt: existingAttempt.startedAt || now,
        },
      });
    } else {
      attempt = await this.prisma.examAttempt.create({
        data: {
          examId,
          studentId: userId,
          status: ExamAttemptStatus.IN_PROGRESS,
          startedAt: now,
          examCheatLog: [],
        },
      });
    }

    return {
      success: true,
      data: attempt,
      message: 'Exam attempt started successfully',
    };
  }

  async autoSaveAnswer(attemptId: string, userId: string, dto: any) {
    // Verify the attempt belongs to the user
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Exam attempt not found');
    }

    if (attempt.studentId !== userId) {
      throw new ForbiddenException('You can only save your own answers');
    }

    if (attempt.status === ExamAttemptStatus.SUBMITTED) {
      throw new ForbiddenException('Cannot save answers for submitted exam');
    }

    // Check if answer already exists
    const existingAnswer = await this.prisma.answer.findUnique({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: dto.questionId,
        },
      },
    });

    let answer;
    if (existingAnswer) {
      // Update existing answer
      answer = await this.prisma.answer.update({
        where: { id: existingAnswer.id },
        data: {
          answerText: dto.answer || dto.essayAnswer || existingAnswer.answerText,
          selectedOptionId: dto.answer || existingAnswer.selectedOptionId,
        },
      });
    } else {
      // Create new answer
      answer = await this.prisma.answer.create({
        data: {
          attemptId,
          questionId: dto.questionId,
          answerText: dto.answer || dto.essayAnswer,
          selectedOptionId: dto.answer,
        },
      });
    }

    // Update attempt's autoSavedData
    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        autoSavedData: {
          ...attempt.autoSavedData as any,
          [dto.questionId]: {
            answer: dto.answer,
            essayAnswer: dto.essayAnswer,
            savedAt: new Date().toISOString(),
          },
        },
      },
    });

    return {
      success: true,
      data: answer,
      message: 'Answer auto-saved successfully',
    };
  }

  /**
   * Submit exam attempt (Students only)
   * Heuristic #16: Instructional Assessment — auto-grade where possible
   */
  async submitAttempt(attemptId: string, userId: string, dto: SubmitExamDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Exam attempt not found');
    }

    // Verify ownership
    if (attempt.studentId !== userId) {
      throw new ForbiddenException('You can only submit your own attempts');
    }

    // Check if already submitted
    if (attempt.status === ExamAttemptStatus.SUBMITTED) {
      throw new ForbiddenException('This attempt has already been submitted');
    }

    // Check deadline
    const now = new Date();
    if (now > attempt.exam.deadline) {
      throw new ForbiddenException('Exam deadline has passed');
    }

    // Save answers and auto-grade
    let totalScore = 0;
    const answers = [];

    for (const answerDto of dto.answers) {
      const question = attempt.exam.questions.find((q: any) => q.id === answerDto.questionId);
      if (!question) continue;

      let score = 0;
      let feedback = '';

      // Auto-grade multiple choice
      if (question.type === QuestionType.MULTIPLE_CHOICE && answerDto.answer) {
        const correctOption = question.options.find((o: any) => o.isCorrect);
        if (correctOption && answerDto.answer === correctOption.id) {
          score = question.points;
          feedback = 'Correct answer';
        } else {
          feedback = 'Incorrect answer';
        }
      }

      // Auto-grade true/false
      if (question.type === 'TRUE_FALSE' && answerDto.answer) {
        const userAnswer = answerDto.answer.toLowerCase();
        const correctOption = question.options.find((o: any) => o.isCorrect);
        
        if (correctOption) {
          const correctAnswer = correctOption.optionText.toLowerCase();
          if (userAnswer === correctAnswer) {
            score = question.points;
            feedback = 'Correct answer';
          } else {
            feedback = 'Incorrect answer';
          }
        } else {
          feedback = 'Pending manual grading';
        }
      }

      // Auto-grade short answer
      if (question.type === QuestionType.SHORT_ANSWER && answerDto.answer) {
        const userAnswer = answerDto.answer.trim();
        const correctOption = question.options.find((o: any) => o.isCorrect);
        
        if (correctOption) {
          const correctAnswer = correctOption.optionText.trim();
          // Case-insensitive comparison for short answers
          if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
            score = question.points;
            feedback = 'Correct answer';
          } else {
            feedback = 'Incorrect answer';
          }
        } else {
          feedback = 'Pending manual grading';
        }
      }

      // Essay questions need manual grading
      if (question.type === QuestionType.ESSAY) {
        feedback = 'Pending manual grading';
      }

      totalScore += score;

      const answer = await this.prisma.answer.create({
        data: {
          attemptId,
          questionId: answerDto.questionId,
          answerText: answerDto.answer || answerDto.essayAnswer || '',
          selectedOptionId: answerDto.answer || null,
          score,
          feedback,
        },
      });

      answers.push(answer);
    }

    // Update attempt
    const submittedAttempt = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: ExamAttemptStatus.SUBMITTED,
        submittedAt: now,
        totalScore,
      },
    });

    return {
      success: true,
      data: submittedAttempt,
      message: 'Exam submitted successfully',
    };
  }

  /**
   * Get exam attempt by ID
   */
  async getAttempt(attemptId: string, userId: string, userRole: Role) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            course: true,
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Exam attempt not found');
    }

    // Check access permissions
    const hasAccess =
      userRole === Role.ADMIN ||
      attempt.exam.course.instructorId === userId ||
      attempt.studentId === userId;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this attempt');
    }

    return {
      success: true,
      data: attempt,
      message: 'Exam attempt retrieved successfully',
    };
  }

  /**
   * Get all attempts for an exam (Admin or course instructor only)
   */
  async getAttempts(examId: string, userId: string, userRole: Role) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && exam.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can view all attempts');
    }

    const attempts = await this.prisma.examAttempt.findMany({
      where: { examId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return {
      success: true,
      data: attempts,
      message: 'Exam attempts retrieved successfully',
    };
  }

  /**
   * Grade exam attempt manually (Admin or course instructor only)
   * Heuristic #16: Instructional Assessment — detailed manual grading
   */
  async gradeAttempt(
    attemptId: string,
    userId: string,
    userRole: Role,
    dto: { answers: Array<{ questionId: string; score: number; feedback?: string }> },
  ) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Exam attempt not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && attempt.exam.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can grade attempts');
    }

    // Update answers with manual grading
    for (const gradeData of dto.answers) {
      await this.prisma.answer.updateMany({
        where: {
          attemptId,
          questionId: gradeData.questionId,
        },
        data: {
          score: gradeData.score,
          feedback: gradeData.feedback,
        },
      });
    }

    // Recalculate total score
    const answers = await this.prisma.answer.findMany({
      where: { attemptId },
    });

    const totalScore = answers.reduce((sum: number, a: any) => sum + (a.score || 0), 0);

    // Update attempt
    const gradedAttempt = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        totalScore,
        status: ExamAttemptStatus.GRADED,
      },
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: gradedAttempt,
      message: 'Exam attempt graded successfully',
    };
  }

  /**
   * Reorder questions in an exam (Admin or course instructor only)
   */
  async reorderQuestions(
    examId: string,
    userId: string,
    userRole: Role,
    questionOrders: { id: string; order: number }[],
  ) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && exam.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can reorder questions');
    }

    // Update orders in a transaction
    await this.prisma.$transaction(
      questionOrders.map(({ id, order }) =>
        this.prisma.question.update({
          where: { id },
          data: { order },
        }),
      ),
    );

    return {
      success: true,
      data: null,
      message: 'Questions reordered successfully',
    };
  }
}
