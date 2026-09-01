import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { Role, QuizAttemptStatus, QuestionType } from '@prisma/client';
import { AutoValidator } from '../common/base/validation-guide';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new quiz linked to an activity
   */
  async create(
    activityId: string,
    userId: string,
    userRole: Role,
    dto: CreateQuizDto,
  ) {
    const result = AutoValidator.validateObject(dto, {
      title: { type: 'string', required: true, maxLength: 200 },
      description: { type: 'string', required: false, maxLength: 2000 },
      duration: { type: 'number', required: false, min: 1, max: 480 },
      passingScore: { type: 'number', required: false, min: 0, max: 100 },
      allowRetake: { type: 'boolean', required: false },
      maxAttempts: { type: 'number', required: false, min: 1, max: 10 },
      isPublished: { type: 'boolean', required: false },
      showResults: { type: 'boolean', required: false },
      showExplanation: { type: 'boolean', required: false },
      shuffleQuestions: { type: 'boolean', required: false },
      shuffleOptions: { type: 'boolean', required: false },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    const validatedActivityId = AutoValidator.validateUUID(activityId, 'Activity ID');

    // Check if activity exists and user has access
    const activity = await this.prisma.activity.findUnique({
      where: { id: validatedActivityId },
      include: { week: { include: { course: true } } },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && activity.week.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can create quizzes');
    }

    // Check if quiz already exists for this activity
    const existingQuiz = await this.prisma.quiz.findUnique({
      where: { activityId: validatedActivityId },
    });

    if (existingQuiz) {
      throw new BadRequestException('Quiz already exists for this activity');
    }

    const quiz = await this.prisma.quiz.create({
      data: {
        activityId: validatedActivityId,
        title: result.sanitized.title,
        description: result.sanitized.description,
        duration: result.sanitized.duration || 30,
        passingScore: result.sanitized.passingScore || 60,
        allowRetake: result.sanitized.allowRetake || false,
        maxAttempts: result.sanitized.maxAttempts || 1,
        isPublished: result.sanitized.isPublished || false,
        showResults: result.sanitized.showResults !== undefined ? result.sanitized.showResults : true,
        showExplanation: result.sanitized.showExplanation || false,
        shuffleQuestions: result.sanitized.shuffleQuestions || false,
        shuffleOptions: result.sanitized.shuffleOptions || false,
      },
      include: {
        activity: {
          include: {
            week: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: quiz,
      message: 'Quiz created successfully',
    };
  }

  /**
   * Get quiz by ID
   */
  async findOne(id: string, userId: string, userRole: Role) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        activity: {
          include: {
            week: {
              include: {
                course: true,
              },
            },
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

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Check course access
    await this.checkCourseAccess(quiz.activity.week.courseId, userId, userRole);

    // Students can only see published quizzes
    if (userRole === Role.MAHASISWA && !quiz.isPublished) {
      throw new ForbiddenException('Quiz is not published');
    }

    return {
      success: true,
      data: quiz,
    };
  }

  /**
   * Update quiz
   */
  async update(
    id: string,
    userId: string,
    userRole: Role,
    dto: UpdateQuizDto,
  ) {
    const quizResult = await this.findOne(id, userId, userRole);
    const quiz = quizResult.data;

    // Only ADMIN and DOSEN can update quizzes
    if (userRole !== Role.ADMIN && quiz.activity.week.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can update quizzes');
    }

    const updatedQuiz = await this.prisma.quiz.update({
      where: { id },
      data: dto,
    });

    return {
      success: true,
      data: updatedQuiz,
      message: 'Quiz updated successfully',
    };
  }

  /**
   * Delete quiz
   */
  async remove(id: string, userId: string, userRole: Role) {
    const quizResult = await this.findOne(id, userId, userRole);
    const quiz = quizResult.data;

    // Only ADMIN and DOSEN can delete quizzes
    if (userRole !== Role.ADMIN && quiz.activity.week.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can delete quizzes');
    }

    await this.prisma.quiz.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Quiz deleted successfully',
    };
  }

  /**
   * Add question to quiz
   */
  async addQuestion(
    quizId: string,
    userId: string,
    userRole: Role,
    dto: CreateQuizQuestionDto,
  ) {
    const quizResult = await this.findOne(quizId, userId, userRole);
    const quiz = quizResult.data;

    // Only ADMIN and DOSEN can add questions
    if (userRole !== Role.ADMIN && quiz.activity.week.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can add questions');
    }

    const result = AutoValidator.validateObject(dto, {
      type: { type: 'string', required: true },
      questionText: { type: 'string', required: true, maxLength: 500 },
      points: { type: 'number', required: false, min: 1, max: 100 },
      order: { type: 'number', required: false, min: 0 },
      explanation: { type: 'string', required: false, maxLength: 5000 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    const question = await this.prisma.$transaction(async (tx) => {
      const createdQuestion = await tx.quizQuestion.create({
        data: {
          quizId,
          type: result.sanitized.type as QuestionType,
          questionText: result.sanitized.questionText,
          points: result.sanitized.points || 1,
          order: result.sanitized.order || 0,
          explanation: result.sanitized.explanation,
        },
      });

      // Add options for multiple choice questions
      if (result.sanitized.type === 'MULTIPLE_CHOICE' && result.sanitized.options && result.sanitized.options.length > 0) {
        for (let i = 0; i < result.sanitized.options.length; i++) {
          await tx.quizQuestionOption.create({
            data: {
              questionId: createdQuestion.id,
              optionText: result.sanitized.options[i],
              isCorrect: result.sanitized.options[i] === result.sanitized.correctAnswer,
              order: i,
            },
          });
        }
      }

      return createdQuestion;
    });

    return {
      success: true,
      data: question,
      message: 'Question added successfully',
    };
  }

  /**
   * Get quiz questions
   */
  async getQuestions(quizId: string, userId: string, userRole: Role) {
    const quizResult = await this.findOne(quizId, userId, userRole);
    const quiz = quizResult.data;

    // Students can only see questions if quiz is published
    if (userRole === Role.MAHASISWA && !quiz.isPublished) {
      throw new ForbiddenException('Quiz is not published');
    }

    const questions = await this.prisma.quizQuestion.findMany({
      where: { quizId },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // For students, don't show correct answers
    const processedQuestions = userRole === Role.MAHASISWA
      ? questions.map((q) => ({
          ...q,
          options: q.options.map((o) => ({
            ...o,
            isCorrect: false,
          })),
        }))
      : questions;

    // Return data directly - interceptor will wrap it
    return processedQuestions;
  }

  /**
   * Start quiz attempt
   */
  async startAttempt(quizId: string, userId: string, userRole: Role) {
    const quizResult = await this.findOne(quizId, userId, userRole);
    const quiz = quizResult.data;

    if (!quiz.isPublished) {
      throw new ForbiddenException('Quiz is not published');
    }

    // Check previous attempts
    const previousAttempts = await this.prisma.quizAttempt.findMany({
      where: {
        quizId,
        studentId: userId,
      },
      orderBy: { attemptNumber: 'desc' },
    });

    if (previousAttempts.length >= quiz.maxAttempts) {
      throw new ForbiddenException('Maximum attempts reached');
    }

    // Check if there's an in-progress attempt
    const inProgressAttempt = previousAttempts.find(
      (a) => a.status === QuizAttemptStatus.IN_PROGRESS,
    );

    if (inProgressAttempt) {
      return {
        success: true,
        data: inProgressAttempt,
        message: 'Continuing existing attempt',
      };
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: userId,
        startedAt: new Date(),
        status: QuizAttemptStatus.IN_PROGRESS,
        attemptNumber: previousAttempts.length + 1,
      },
    });

    return {
      success: true,
      data: attempt,
      message: 'Quiz attempt started',
    };
  }

  /**
   * Submit quiz attempt
   */
  async submitAttempt(
    attemptId: string,
    userId: string,
    userRole: Role,
    answers: { questionId: string; answerText?: string; selectedOptionId?: string }[],
  ) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
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
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.studentId !== userId) {
      throw new ForbiddenException('You can only submit your own attempts');
    }

    if (attempt.status !== QuizAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Attempt is not in progress');
    }

    // Calculate score
    let totalScore = 0;
    let maxScore = 0;

    for (const question of attempt.quiz.questions) {
      maxScore += question.points;
      const userAnswer = answers.find((a) => a.questionId === question.id);

      if (userAnswer) {
        let isCorrect = false;

        if (question.type === 'MULTIPLE_CHOICE' && userAnswer.selectedOptionId) {
          const selectedOption = question.options.find((o) => o.id === userAnswer.selectedOptionId);
          isCorrect = selectedOption?.isCorrect || false;
        } else if (question.type === 'SHORT_ANSWER' && userAnswer.answerText) {
          isCorrect = userAnswer.answerText.toLowerCase().trim() === question.options[0]?.optionText.toLowerCase().trim();
        }

        if (isCorrect) {
          totalScore += question.points;
        }

        // Save answer
        await this.prisma.quizAnswer.create({
          data: {
            attemptId,
            questionId: question.id,
            answerText: userAnswer.answerText,
            selectedOptionId: userAnswer.selectedOptionId,
            score: isCorrect ? question.points : 0,
          },
        });
      }
    }

    const finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = finalScore >= attempt.quiz.passingScore;

    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        totalScore: finalScore,
        status: QuizAttemptStatus.SUBMITTED,
        submittedAt: new Date(),
        passed,
      },
    });

    return {
      success: true,
      data: updatedAttempt,
      message: 'Quiz submitted successfully',
    };
  }

  /**
   * Get quiz attempts for a student
   */
  async getStudentAttempts(quizId: string, userId: string, userRole: Role) {
    const quizResult = await this.findOne(quizId, userId, userRole);
    const quiz = quizResult.data;

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        quizId,
        studentId: userId,
      },
      include: {
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
      orderBy: { attemptNumber: 'desc' },
    });

    // Return data directly - interceptor will wrap it
    return attempts;
  }

  /**
   * Get all attempts for a quiz (for instructors)
   */
  async getAllAttempts(quizId: string, userId: string, userRole: Role) {
    const quiz = await this.findOne(quizId, userId, userRole);

    // Only ADMIN and DOSEN can see all attempts
    if (userRole !== Role.ADMIN && quiz.data.activity.week.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can view all attempts');
    }

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Return data directly - interceptor will wrap it
    return attempts;
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

    if (userRole === Role.ADMIN) {
      return;
    }

    if (userRole === Role.DOSEN) {
      if (course.instructorId !== userId) {
        throw new ForbiddenException('You do not have access to this course');
      }
      return;
    }

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