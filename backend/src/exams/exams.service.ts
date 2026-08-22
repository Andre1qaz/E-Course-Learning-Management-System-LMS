import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { Role, QuestionType, ExamAttemptStatus, GradingStatus } from '@prisma/client';
import { CalendarService } from '../calendar/calendar.service';
import { NotificationsQueueService } from '../notifications/notifications-queue.service';
import { AutoValidator } from '../common/base/validation-guide';

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
   * ✅ MENGGUNAKAN AutoValidator untuk otomatis format handling
   */
  async create(
    courseId: string,
    userId: string,
    userRole: Role,
    dto: CreateExamDto,
  ) {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      title: { type: 'string', required: true, maxLength: 200 },
      description: { type: 'string', required: false, maxLength: 2000 },
      startTime: { type: 'date', required: true },
      deadline: { type: 'date', required: true },
      duration: { type: 'number', required: true, min: 1, max: 480 },
      isPublished: { type: 'boolean', required: false },
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
        'Only Admin and course instructor can create exams',
      );
    }

    // ✅ Validate dates dengan data yang sudah di-parse
    const startTime = result.sanitized.startTime;
    const deadline = result.sanitized.deadline;

    if (startTime >= deadline) {
      throw new BadRequestException('Start time must be before deadline');
    }

    // ✅ Create dengan data yang sudah divalidasi
    const exam = await this.prisma.exam.create({
      data: {
        courseId: validatedCourseId,
        title: result.sanitized.title,
        description: result.sanitized.description,
        startTime,
        deadline,
        duration: result.sanitized.duration,
        isPublished: result.sanitized.isPublished || false,
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
        where: { courseId: validatedCourseId },
        select: { userId: true },
      });

      const studentIds = enrollments.map((e: any) => e.userId);
      await this.notificationsQueueService.addBulkNotificationJob({
        userIds: studentIds,
        type: 'EXAM_CREATED',
        title: 'Ujian Baru Dijadwalkan',
        message: `Ujian "${exam.title}" telah dijadwalkan di course "${course.name}". Mulai: ${startTime.toLocaleDateString('id-ID')} ${startTime.toLocaleTimeString('id-ID')}`,
        link: `/mahasiswa/courses/${validatedCourseId}/exams/${exam.id}`,
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

    const hideAnswers = userRole === Role.MAHASISWA;
    const mappedQuestions = exam.questions.map((q: any) =>
      this.mapQuestionForClient(q, hideAnswers),
    );

    let myAttempt = null;
    if (userRole === Role.MAHASISWA) {
      myAttempt = await this.prisma.examAttempt.findFirst({
        where: { examId: id, studentId: userId },
        orderBy: { attemptNumber: 'desc' },
        select: {
          id: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          totalScore: true,
        },
      });
    }

    const { questions: _questions, ...examData } = exam;

    return {
      success: true,
      data: {
        ...examData,
        questions: hideAnswers ? [] : mappedQuestions,
        questionCount: exam.questions.length,
        myAttempt,
      },
      message: 'Exam retrieved successfully',
    };
  }

  /**
   * Update exam (Admin or course instructor only)
   * ✅ MENGGUNAKAN AutoValidator untuk otomatis format handling
   */
  async update(id: string, userId: string, userRole: Role, dto: UpdateExamDto) {
    // ✅ Auto-validation untuk field yang di-update
    const result = AutoValidator.validateObject(dto, {
      title: { type: 'string', required: false, maxLength: 200 },
      description: { type: 'string', required: false, maxLength: 2000 },
      startTime: { type: 'date', required: false },
      deadline: { type: 'date', required: false },
      duration: { type: 'number', required: false, min: 1, max: 480 },
      isPublished: { type: 'boolean', required: false },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate exam ID
    const validatedId = AutoValidator.validateUUID(id, 'Exam ID');

    const exam = await this.prisma.exam.findUnique({
      where: { id: validatedId },
      include: {
        course: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && exam.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only Admin and course instructor can update this exam',
      );
    }

    // Prevent editing if exam has attempts
    const hasAttempts = await this.prisma.examAttempt.findFirst({
      where: { examId: validatedId, status: ExamAttemptStatus.SUBMITTED },
    });

    if (hasAttempts) {
      throw new BadRequestException(
        'Cannot update exam that has been taken by students',
      );
    }

    // ✅ Update dengan data yang sudah divalidasi
    const updatedExam = await this.prisma.exam.update({
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

    await this.calendarService.createEventFromExam(updatedExam.id);

    if (result.sanitized.startTime || result.sanitized.deadline) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId: exam.courseId },
        select: { userId: true },
      });
      await this.notificationsQueueService.addBulkNotificationJob({
        userIds: enrollments.map((e) => e.userId),
        type: 'SCHEDULE_CHANGED',
        title: 'Perubahan Jadwal Ujian',
        message: `Jadwal ujian "${updatedExam.title}" telah diubah`,
        link: `/mahasiswa/courses/${exam.courseId}/exams/${validatedId}`,
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
      throw new ForbiddenException(
        'Only Admin and course instructor can delete this exam',
      );
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
      throw new ForbiddenException(
        'Only Admin and course instructor can publish this exam',
      );
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

    if (userRole === Role.MAHASISWA) {
      return {
        success: true,
        data: await this.attachMyAttempts(exams, userId),
        message: 'Exams retrieved successfully',
      };
    }

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
        isPublished: true,
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

    if (userRole === Role.MAHASISWA) {
      return {
        success: true,
        data: await this.attachMyAttempts(exams, userId),
        message: 'Exams retrieved successfully',
      };
    }

    return {
      success: true,
      data: exams,
      message: 'Exams retrieved successfully',
    };
  }

  /**
   * Add question to exam (Admin or course instructor only)
   */
  async addQuestion(
    examId: string,
    userId: string,
    userRole: Role,
    dto: CreateQuestionDto,
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
      throw new ForbiddenException(
        'Only Admin and course instructor can add questions',
      );
    }

    // Prevent adding questions if exam has attempts
    const hasAttempts = await this.prisma.examAttempt.findFirst({
      where: { examId, status: ExamAttemptStatus.SUBMITTED },
    });

    if (hasAttempts) {
      throw new BadRequestException(
        'Cannot add questions to exam that has been taken',
      );
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

    // Add options for multiple choice and true/false
    if (
      (dto.type === QuestionType.MULTIPLE_CHOICE ||
        dto.type === QuestionType.TRUE_FALSE) &&
      dto.options
    ) {
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

    if (userRole === Role.MAHASISWA) {
      const attempt = await this.prisma.examAttempt.findFirst({
        where: { examId, studentId: userId },
        orderBy: { attemptNumber: 'desc' },
        select: { status: true },
      });

      const canSeeQuestions =
        attempt &&
        (attempt.status === ExamAttemptStatus.IN_PROGRESS ||
          attempt.status === ExamAttemptStatus.SUBMITTED ||
          attempt.status === ExamAttemptStatus.GRADED);

      if (!canSeeQuestions) {
        throw new ForbiddenException(
          'Soal hanya tersedia setelah ujian dimulai',
        );
      }
    }

    const hideAnswers = userRole === Role.MAHASISWA;
    const mapped = questions.map((q) =>
      this.mapQuestionForClient(q, hideAnswers),
    );

    return {
      success: true,
      data: mapped,
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
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const isEnrolled = exam.course.enrollments.some(
      (e: any) => e.userId === userId,
    );
    if (!isEnrolled) {
      throw new ForbiddenException(
        'Anda harus terdaftar di course ini untuk mengikuti ujian',
      );
    }

    if (!exam.isPublished) {
      throw new ForbiddenException('Ujian ini belum dipublikasikan');
    }

    if (exam.questions.length === 0) {
      throw new BadRequestException('Ujian ini belum memiliki soal');
    }

    const now = new Date();
    if (now < exam.startTime) {
      throw new ForbiddenException('Ujian belum dimulai');
    }

    const existingAttempt = await this.prisma.examAttempt.findFirst({
      where: { examId, studentId: userId },
      include: { answers: true },
      orderBy: { attemptNumber: 'desc' },
    });

    const isClosedStatus =
      existingAttempt &&
      (existingAttempt.status === ExamAttemptStatus.SUBMITTED ||
        existingAttempt.status === ExamAttemptStatus.GRADED);

    if (isClosedStatus) {
      return {
        success: true,
        data: {
          ...existingAttempt,
          alreadySubmitted: true,
          remainingSeconds: 0,
          questions: [],
          savedAnswers: {},
          exam: {
            id: exam.id,
            title: exam.title,
            duration: exam.duration,
            startTime: exam.startTime,
            deadline: exam.deadline,
          },
        },
        message: 'Ujian sudah dikumpulkan sebelumnya',
      };
    }

    if (now > exam.deadline && !existingAttempt) {
      throw new ForbiddenException('Batas waktu ujian sudah lewat');
    }

    let attempt = existingAttempt;
    if (!attempt) {
      attempt = await this.prisma.examAttempt.create({
        data: {
          examId,
          studentId: userId,
          status: ExamAttemptStatus.IN_PROGRESS,
          startedAt: now,
          examCheatLog: [],
        },
        include: { answers: true },
      });
    } else if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
      attempt = await this.prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          status: ExamAttemptStatus.IN_PROGRESS,
          startedAt: attempt.startedAt || now,
        },
        include: { answers: true },
      });
    }

    const startedAt = attempt.startedAt || now;
    const remainingSeconds = this.remainingSeconds(
      startedAt,
      exam.duration,
      exam.deadline,
    );

    if (remainingSeconds <= 0) {
      const savedAnswers = this.collectSavedAnswers(attempt);
      const autoAnswers = Object.entries(savedAnswers).map(
        ([questionId, answer]) => ({ questionId, answer }),
      );
      return this.submitAttempt(attempt.id, userId, {
        answers: autoAnswers,
        autoSubmitted: true,
      });
    }

    return {
      success: true,
      data: {
        ...attempt,
        alreadySubmitted: false,
        remainingSeconds,
        questions: exam.questions.map((q) =>
          this.mapQuestionForClient(q, true),
        ),
        savedAnswers: this.collectSavedAnswers(attempt),
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          startTime: exam.startTime,
          deadline: exam.deadline,
        },
      },
      message: 'Ujian dimulai',
    };
  }

  async autoSaveAnswer(attemptId: string, userId: string, dto: any) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Exam attempt not found');
    }

    if (attempt.studentId !== userId) {
      throw new ForbiddenException('Anda hanya dapat menyimpan jawaban sendiri');
    }

    if (
      attempt.status === ExamAttemptStatus.SUBMITTED ||
      attempt.status === ExamAttemptStatus.GRADED
    ) {
      throw new ForbiddenException(
        'Tidak dapat menyimpan jawaban setelah ujian dikumpulkan',
      );
    }

    if (!dto?.questionId) {
      throw new BadRequestException('questionId wajib diisi');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
      include: { options: true },
    });

    if (!question || question.examId !== attempt.examId) {
      throw new BadRequestException('Soal tidak valid untuk ujian ini');
    }

    const rawAnswer = (dto.answer ?? dto.essayAnswer ?? '').toString();
    const { answerText, selectedOptionId } = this.resolveAnswerFields(
      question,
      rawAnswer,
    );

    const answer = await this.prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: dto.questionId,
        },
      },
      update: {
        answerText,
        selectedOptionId,
      },
      create: {
        attemptId,
        questionId: dto.questionId,
        answerText,
        selectedOptionId,
      },
    });

    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        autoSavedData: {
          ...((attempt.autoSavedData as Record<string, unknown>) || {}),
          [dto.questionId]: {
            answer: rawAnswer,
            savedAt: new Date().toISOString(),
          },
        },
      },
    });

    return {
      success: true,
      data: answer,
      message: 'Jawaban tersimpan',
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
        answers: true,
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

    if (attempt.studentId !== userId) {
      throw new ForbiddenException('Anda hanya dapat mengumpulkan ujian sendiri');
    }

    if (
      attempt.status === ExamAttemptStatus.SUBMITTED ||
      attempt.status === ExamAttemptStatus.GRADED
    ) {
      return {
        success: true,
        data: {
          ...attempt,
          alreadySubmitted: true,
          maxPossibleScore: this.sumQuestionPoints(attempt.exam.questions),
        },
        message: 'Ujian sudah dikumpulkan sebelumnya',
      };
    }

    const mergedAnswers = this.mergeSubmissionAnswers(attempt, dto.answers || []);
    const now = new Date();
    let totalScore = 0;
    let needsManualGrading = false;

    for (const question of attempt.exam.questions) {
      const answerDto = mergedAnswers.get(question.id);
      const rawAnswer = answerDto
        ? (answerDto.answer ?? answerDto.essayAnswer ?? '').toString()
        : '';
      const { answerText, selectedOptionId } = this.resolveAnswerFields(
        question,
        rawAnswer,
      );
      const { score, feedback, pendingManual } = this.gradeQuestion(
        question,
        rawAnswer,
        selectedOptionId,
      );

      if (pendingManual) needsManualGrading = true;
      totalScore += score;

      await this.prisma.answer.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId: question.id,
          },
        },
        update: {
          answerText,
          selectedOptionId,
          score,
          feedback,
        },
        create: {
          attemptId,
          questionId: question.id,
          answerText,
          selectedOptionId,
          score,
          feedback,
        },
      });
    }

    const submittedAttempt = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: ExamAttemptStatus.SUBMITTED,
        submittedAt: now,
        totalScore,
        gradingStatus: needsManualGrading
          ? GradingStatus.PENDING
          : GradingStatus.COMPLETED,
      },
    });

    return {
      success: true,
      data: {
        ...submittedAttempt,
        alreadySubmitted: true,
        maxPossibleScore: this.sumQuestionPoints(attempt.exam.questions),
      },
      message: dto.autoSubmitted
        ? 'Waktu habis. Ujian dikumpulkan otomatis'
        : 'Ujian berhasil dikumpulkan',
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
      throw new ForbiddenException(
        'Only Admin and course instructor can view all attempts',
      );
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
    dto: {
      answers: Array<{ questionId: string; score: number; feedback?: string }>;
    },
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
    if (
      userRole !== Role.ADMIN &&
      attempt.exam.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'Only Admin and course instructor can grade attempts',
      );
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

    const totalScore = answers.reduce(
      (sum: number, a: any) => sum + (a.score || 0),
      0,
    );

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
      throw new ForbiddenException(
        'Only Admin and course instructor can reorder questions',
      );
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

  private async attachMyAttempts<T extends { id: string }>(
    exams: T[],
    userId: string,
  ) {
    const myAttempts = await this.prisma.examAttempt.findMany({
      where: {
        studentId: userId,
        examId: { in: exams.map((exam) => exam.id) },
      },
      orderBy: { attemptNumber: 'desc' },
      select: {
        id: true,
        examId: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        totalScore: true,
      },
    });

    const latestByExam = new Map<string, (typeof myAttempts)[number]>();
    for (const attempt of myAttempts) {
      if (!latestByExam.has(attempt.examId)) {
        latestByExam.set(attempt.examId, attempt);
      }
    }

    return exams.map((exam) => ({
      ...exam,
      myAttempt: latestByExam.get(exam.id) ?? null,
    }));
  }

  private remainingSeconds(
    startedAt: Date,
    durationMinutes: number,
    deadline: Date,
  ) {
    const durationEnd = new Date(
      startedAt.getTime() + durationMinutes * 60 * 1000,
    );
    const hardEnd = deadline.getTime() < durationEnd.getTime() ? deadline : durationEnd;
    return Math.max(0, Math.floor((hardEnd.getTime() - Date.now()) / 1000));
  }

  private mapQuestionForClient(question: any, hideAnswers: boolean) {
    return {
      id: question.id,
      type: question.type,
      questionText: question.questionText,
      points: question.points,
      order: question.order,
      attachmentUrl: question.attachmentUrl,
      maxChars: question.maxChars,
      explanation: hideAnswers ? undefined : question.explanation,
      options: (question.options || []).map((option: any) => ({
        id: option.id,
        text: option.optionText ?? option.text,
        optionText: option.optionText ?? option.text,
        order: option.order,
        isCorrect: hideAnswers ? undefined : option.isCorrect,
      })),
    };
  }

  private collectSavedAnswers(attempt: {
    answers?: Array<{
      questionId: string;
      answerText?: string | null;
      selectedOptionId?: string | null;
    }>;
    autoSavedData?: unknown;
  }): Record<string, string> {
    const saved: Record<string, string> = {};
    const autoSaved = attempt.autoSavedData;

    if (autoSaved && typeof autoSaved === 'object' && !Array.isArray(autoSaved)) {
      for (const [questionId, value] of Object.entries(
        autoSaved as Record<string, unknown>,
      )) {
        if (typeof value === 'string' && value) {
          saved[questionId] = value;
        } else if (value && typeof value === 'object' && 'answer' in value) {
          const answer = (value as { answer?: unknown }).answer;
          if (answer != null && String(answer) !== '') {
            saved[questionId] = String(answer);
          }
        }
      }
    }

    for (const answer of attempt.answers || []) {
      const value = answer.selectedOptionId || answer.answerText || '';
      if (value) {
        saved[answer.questionId] = value;
      }
    }

    return saved;
  }

  private resolveAnswerFields(
    question: any,
    rawAnswer: string,
  ): { answerText: string | null; selectedOptionId: string | null } {
    const trimmed = (rawAnswer || '').trim();
    if (!trimmed) {
      return { answerText: null, selectedOptionId: null };
    }

    if (
      question.type === QuestionType.MULTIPLE_CHOICE ||
      question.type === QuestionType.TRUE_FALSE
    ) {
      const options = question.options || [];
      const byId = options.find((option: any) => option.id === trimmed);
      if (byId) {
        return {
          answerText: byId.optionText ?? trimmed,
          selectedOptionId: byId.id,
        };
      }

      const byText = options.find(
        (option: any) =>
          String(option.optionText ?? option.text ?? '')
            .trim()
            .toLowerCase() === trimmed.toLowerCase(),
      );
      if (byText) {
        return {
          answerText: byText.optionText ?? trimmed,
          selectedOptionId: byText.id,
        };
      }

      return { answerText: trimmed, selectedOptionId: null };
    }

    return { answerText: trimmed, selectedOptionId: null };
  }

  private gradeQuestion(
    question: any,
    rawAnswer: string,
    selectedOptionId: string | null,
  ): { score: number; feedback: string; pendingManual: boolean } {
    if (question.type === QuestionType.ESSAY) {
      return {
        score: 0,
        feedback: 'Menunggu penilaian manual',
        pendingManual: true,
      };
    }

    if (
      question.type === QuestionType.MULTIPLE_CHOICE ||
      question.type === QuestionType.TRUE_FALSE
    ) {
      const correct = (question.options || []).find(
        (option: any) => option.isCorrect,
      );
      if (!correct) {
        return {
          score: 0,
          feedback: 'Menunggu penilaian manual',
          pendingManual: true,
        };
      }

      const isCorrect =
        selectedOptionId === correct.id ||
        rawAnswer.trim().toLowerCase() ===
          String(correct.optionText ?? '').trim().toLowerCase();

      return {
        score: isCorrect ? question.points : 0,
        feedback: isCorrect ? 'Jawaban benar' : 'Jawaban salah',
        pendingManual: false,
      };
    }

    if (question.type === QuestionType.SHORT_ANSWER) {
      const correct = (question.options || []).find(
        (option: any) => option.isCorrect,
      );
      if (!correct) {
        return {
          score: 0,
          feedback: 'Menunggu penilaian manual',
          pendingManual: true,
        };
      }

      const userAnswer = question.caseSensitive
        ? rawAnswer.trim()
        : rawAnswer.trim().toLowerCase();
      const expected = question.caseSensitive
        ? String(correct.optionText ?? '').trim()
        : String(correct.optionText ?? '').trim().toLowerCase();

      const isCorrect = userAnswer === expected;
      return {
        score: isCorrect ? question.points : 0,
        feedback: isCorrect ? 'Jawaban benar' : 'Jawaban salah',
        pendingManual: false,
      };
    }

    return { score: 0, feedback: '', pendingManual: false };
  }

  private mergeSubmissionAnswers(
    attempt: {
      answers?: Array<{
        questionId: string;
        answerText?: string | null;
        selectedOptionId?: string | null;
      }>;
      autoSavedData?: unknown;
    },
    answers: Array<{ questionId: string; answer?: string; essayAnswer?: string }>,
  ) {
    const merged = new Map<
      string,
      { questionId: string; answer?: string; essayAnswer?: string }
    >();
    const saved = this.collectSavedAnswers(attempt);

    for (const [questionId, answer] of Object.entries(saved)) {
      merged.set(questionId, { questionId, answer });
    }

    for (const item of answers || []) {
      const value = (item.answer ?? item.essayAnswer ?? '').toString();
      if (value !== '') {
        merged.set(item.questionId, item);
      }
    }

    return merged;
  }

  private sumQuestionPoints(questions: Array<{ points: number }>) {
    return questions.reduce((sum, question) => sum + (question.points || 0), 0);
  }
}
