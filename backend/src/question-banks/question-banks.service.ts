import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { DifficultyLevel, QuestionType } from '@prisma/client';

@Injectable()
export class QuestionBanksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, userRole: Role, dto: any) {
    // Check course access if courseId is provided
    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Check permissions
      if (userRole !== Role.ADMIN && course.instructorId !== userId) {
        throw new ForbiddenException('Only Admin and course instructor can create question banks');
      }
    }

    const questionBank = await this.prisma.questionBank.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        description: dto.description,
        topic: dto.topic,
        difficulty: dto.difficulty || DifficultyLevel.MEDIUM,
        questionType: dto.questionType,
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

    return {
      success: true,
      data: questionBank,
      message: 'Question bank created successfully',
    };
  }

  async findAll(userId: string, userRole: Role) {
    const where = userRole === Role.ADMIN ? {} : { course: { instructorId: userId } };

    const questionBanks = await this.prisma.questionBank.findMany({
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: questionBanks,
    };
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const questionBank = await this.prisma.questionBank.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            instructorId: true,
          },
        },
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!questionBank) {
      throw new NotFoundException('Question bank not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && questionBank.course?.instructorId !== userId) {
      throw new ForbiddenException('You do not have access to this question bank');
    }

    return {
      success: true,
      data: questionBank,
    };
  }

  async update(id: string, userId: string, userRole: Role, dto: any) {
    const questionBank = await this.prisma.questionBank.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!questionBank) {
      throw new NotFoundException('Question bank not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && questionBank.course?.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can update question banks');
    }

    const updated = await this.prisma.questionBank.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        topic: dto.topic,
        difficulty: dto.difficulty,
        questionType: dto.questionType,
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

    return {
      success: true,
      data: updated,
      message: 'Question bank updated successfully',
    };
  }

  async delete(id: string, userId: string, userRole: Role) {
    const questionBank = await this.prisma.questionBank.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!questionBank) {
      throw new NotFoundException('Question bank not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && questionBank.course?.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can delete question banks');
    }

    await this.prisma.questionBank.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Question bank deleted successfully',
    };
  }

  async addQuestion(questionBankId: string, userId: string, userRole: Role, dto: any) {
    const questionBank = await this.prisma.questionBank.findUnique({
      where: { id: questionBankId },
      include: {
        course: true,
      },
    });

    if (!questionBank) {
      throw new NotFoundException('Question bank not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && questionBank.course?.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can add questions');
    }

    // Get next order
    const lastQuestion = await this.prisma.question.findFirst({
      where: { questionBankId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = lastQuestion ? lastQuestion.order + 1 : 0;

    // Create question
    const question = await this.prisma.question.create({
      data: {
        questionBankId,
        type: dto.type,
        questionText: dto.questionText,
        points: dto.points,
        order: nextOrder,
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
      message: 'Question added to bank successfully',
    };
  }

  async removeQuestion(questionId: string, userId: string, userRole: Role) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        questionBank: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && question.questionBank?.course?.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can remove questions');
    }

    await this.prisma.question.delete({
      where: { id: questionId },
    });

    return {
      success: true,
      message: 'Question removed from bank successfully',
    };
  }

  async importFromBank(questionBankId: string, examId: string, userId: string, userRole: Role) {
    const questionBank = await this.prisma.questionBank.findUnique({
      where: { id: questionBankId },
      include: {
        course: true,
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!questionBank) {
      throw new NotFoundException('Question bank not found');
    }

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
    if (userRole !== Role.ADMIN && (questionBank.course?.instructorId !== userId || exam.course?.instructorId !== userId)) {
      throw new ForbiddenException('Only Admin and course instructor can import questions');
    }

    // Get next order for exam
    const lastQuestion = await this.prisma.question.findFirst({
      where: { examId },
      orderBy: { order: 'desc' },
    });

    let nextOrder = lastQuestion ? lastQuestion.order + 1 : 0;

    // Import questions
    const importedQuestions = [];
    for (const bankQuestion of questionBank.questions) {
      const question = await this.prisma.question.create({
        data: {
          examId,
          type: bankQuestion.type,
          questionText: bankQuestion.questionText,
          points: bankQuestion.points,
          order: nextOrder,
          isFromBank: true,
        },
      });

      // Import options
      if (bankQuestion.options && bankQuestion.options.length > 0) {
        for (const option of bankQuestion.options) {
          await this.prisma.questionOption.create({
            data: {
              questionId: question.id,
              optionText: option.optionText,
              isCorrect: option.isCorrect,
              order: option.order,
            },
          });
        }
      }

      importedQuestions.push(question);
      nextOrder++;
    }

    return {
      success: true,
      data: importedQuestions,
      message: `${importedQuestions.length} questions imported successfully`,
    };
  }
}
