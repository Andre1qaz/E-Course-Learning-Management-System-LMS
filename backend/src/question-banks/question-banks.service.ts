import { Injectable, NotFoundException, ForbiddenException, BadRequestException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { DifficultyLevel, QuestionType } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { AutoValidator } from '../common/base/validation-guide';

@Injectable()
export class QuestionBanksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, userRole: Role, dto: any) {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      title: { type: 'string', required: true, maxLength: 200 },
      description: { type: 'string', required: false, maxLength: 2000 },
      topic: { type: 'string', required: false, maxLength: 100 },
      courseId: { type: 'uuid', required: false },
      difficulty: { type: 'string', required: false },
      questionType: { type: 'string', required: false },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // Check course access if courseId is provided
    if (result.sanitized.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: result.sanitized.courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Check permissions
      if (userRole !== Role.ADMIN && course.instructorId !== userId) {
        throw new ForbiddenException('Only Admin and course instructor can create question banks');
      }
    }

    // ✅ Create dengan data yang sudah divalidasi
    const questionBank = await this.prisma.questionBank.create({
      data: {
        courseId: result.sanitized.courseId,
        title: result.sanitized.title,
        description: result.sanitized.description,
        topic: result.sanitized.topic,
        difficulty: result.sanitized.difficulty || DifficultyLevel.MEDIUM,
        questionType: result.sanitized.questionType,
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

  async exportQuestionBank(id: string, userId: string, userRole: Role, format: string, res: Response) {
    const questionBank = await this.prisma.questionBank.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
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

    const fileName = `${questionBank.title.replace(/[^a-z0-9]/gi, '_')}_export`;

    switch (format.toLowerCase()) {
      case 'json':
        return this.exportAsJson(questionBank, fileName, res);
      case 'csv':
        return this.exportAsCsv(questionBank, fileName, res);
      case 'excel':
      case 'xlsx':
        return this.exportAsExcel(questionBank, fileName, res);
      default:
        throw new BadRequestException('Unsupported export format. Use: json, csv, or excel');
    }
  }

  private async exportAsJson(questionBank: any, fileName: string, res: Response) {
    const exportData = {
      metadata: {
        title: questionBank.title,
        description: questionBank.description,
        topic: questionBank.topic,
        difficulty: questionBank.difficulty,
        questionType: questionBank.questionType,
        course: questionBank.course,
        exportedAt: new Date().toISOString(),
      },
      questions: questionBank.questions.map((q: any) => ({
        type: q.type,
        questionText: q.questionText,
        points: q.points,
        explanation: q.explanation,
        options: q.options?.map((o: any) => ({
          optionText: o.optionText,
          isCorrect: o.isCorrect,
        })),
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.json"`);
    res.status(HttpStatus.OK).json(exportData);
  }

  private async exportAsCsv(questionBank: any, fileName: string, res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Questions');

    // Headers
    worksheet.columns = [
      { header: 'Question ID', key: 'id' },
      { header: 'Type', key: 'type' },
      { header: 'Question Text', key: 'questionText' },
      { header: 'Points', key: 'points' },
      { header: 'Explanation', key: 'explanation' },
      { header: 'Options', key: 'options' },
      { header: 'Correct Answer', key: 'correctAnswer' },
    ];

    // Add questions
    questionBank.questions.forEach((q: any) => {
      const optionsText = q.options?.map((o: any) => o.optionText).join(' | ') || '';
      const correctAnswer = q.options?.filter((o: any) => o.isCorrect).map((o: any) => o.optionText).join(' | ') || '';

      worksheet.addRow({
        id: q.id,
        type: q.type,
        questionText: q.questionText,
        points: q.points,
        explanation: q.explanation || '',
        options: optionsText,
        correctAnswer: correctAnswer,
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);

    const buffer = await workbook.csv.writeBuffer();
    res.status(HttpStatus.OK).send(buffer);
  }

  private async exportAsExcel(questionBank: any, fileName: string, res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Questions');

    // Add metadata
    worksheet.addRow(['Question Bank Export']);
    worksheet.addRow(['Title', questionBank.title]);
    worksheet.addRow(['Description', questionBank.description]);
    worksheet.addRow(['Topic', questionBank.topic]);
    worksheet.addRow(['Difficulty', questionBank.difficulty]);
    worksheet.addRow(['Question Type', questionBank.questionType]);
    worksheet.addRow(['Course', questionBank.course?.name || 'N/A']);
    worksheet.addRow(['Exported At', new Date().toLocaleString()]);
    worksheet.addRow([]); // Empty row

    // Headers
    worksheet.columns = [
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Question Text', key: 'questionText', width: 50 },
      { header: 'Points', key: 'points', width: 10 },
      { header: 'Explanation', key: 'explanation', width: 30 },
      { header: 'Option 1', key: 'option1', width: 20 },
      { header: 'Option 2', key: 'option2', width: 20 },
      { header: 'Option 3', key: 'option3', width: 20 },
      { header: 'Option 4', key: 'option4', width: 20 },
      { header: 'Correct Answer(s)', key: 'correctAnswer', width: 20 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(9);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add questions
    questionBank.questions.forEach((q: any) => {
      const options = q.options || [];
      const correctAnswers = options.filter((o: any) => o.isCorrect).map((o: any, i: number) => `Option ${i + 1}`).join(', ');

      worksheet.addRow({
        type: q.type,
        questionText: q.questionText,
        points: q.points,
        explanation: q.explanation || '',
        option1: options[0]?.optionText || '',
        option2: options[1]?.optionText || '',
        option3: options[2]?.optionText || '',
        option4: options[3]?.optionText || '',
        correctAnswer: correctAnswers,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);

    const buffer = await workbook.xlsx.writeBuffer();
    res.status(HttpStatus.OK).send(buffer);
  }

  async importQuestionBank(format: string, data: any, userId: string, userRole: Role, courseId?: string) {
    // Check course access if courseId is provided
    if (courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      if (userRole !== Role.ADMIN && course.instructorId !== userId) {
        throw new ForbiddenException('Only Admin and course instructor can import question banks');
      }
    }

    switch (format.toLowerCase()) {
      case 'json':
        return this.importFromJson(data, userId, userRole, courseId);
      case 'csv':
        return this.importFromCsv(data, userId, userRole, courseId);
      case 'excel':
      case 'xlsx':
        return this.importFromExcel(data, userId, userRole, courseId);
      default:
        throw new BadRequestException('Unsupported import format. Use: json, csv, or excel');
    }
  }

  private async importFromJson(data: any, userId: string, userRole: Role, courseId?: string) {
    const { metadata, questions } = data;

    if (!metadata || !questions) {
      throw new BadRequestException('Invalid JSON format. Missing metadata or questions');
    }

    // Create question bank
    const questionBank = await this.prisma.questionBank.create({
      data: {
        courseId,
        title: metadata.title,
        description: metadata.description,
        topic: metadata.topic,
        difficulty: metadata.difficulty || DifficultyLevel.MEDIUM,
        questionType: metadata.questionType,
      },
    });

    // Import questions
    for (const q of questions) {
      const question = await this.prisma.question.create({
        data: {
          questionBankId: questionBank.id,
          type: q.type,
          questionText: q.questionText,
          points: q.points,
          explanation: q.explanation,
        },
      });

      // Import options for multiple choice
      if (q.type === QuestionType.MULTIPLE_CHOICE && q.options) {
        for (let i = 0; i < q.options.length; i++) {
          await this.prisma.questionOption.create({
            data: {
              questionId: question.id,
              optionText: q.options[i].optionText,
              isCorrect: q.options[i].isCorrect,
              order: i,
            },
          });
        }
      }
    }

    return {
      success: true,
      data: questionBank,
      message: `Question bank imported with ${questions.length} questions`,
    };
  }

  private async importFromCsv(data: any, userId: string, userRole: Role, courseId?: string) {
    // For CSV import, data should be an array of objects
    if (!Array.isArray(data)) {
      throw new BadRequestException('Invalid CSV format. Expected array of question objects');
    }

    // Create question bank
    const questionBank = await this.prisma.questionBank.create({
      data: {
        courseId,
        title: `Imported Question Bank ${new Date().toISOString()}`,
        description: 'Imported from CSV',
        topic: 'Imported',
        difficulty: DifficultyLevel.MEDIUM,
        questionType: QuestionType.MULTIPLE_CHOICE, // Default
      },
    });

    // Import questions
    for (const q of data) {
      const question = await this.prisma.question.create({
        data: {
          questionBankId: questionBank.id,
          type: q.type || QuestionType.MULTIPLE_CHOICE,
          questionText: q.questionText,
          points: parseFloat(q.points) || 1,
          explanation: q.explanation,
        },
      });

      // Import options for multiple choice
      if (q.options && typeof q.options === 'string') {
        const optionTexts = q.options.split(' | ');
        const correctAnswers = q.correctAnswer ? q.correctAnswer.split(' | ') : [];

        for (let i = 0; i < optionTexts.length; i++) {
          await this.prisma.questionOption.create({
            data: {
              questionId: question.id,
              optionText: optionTexts[i].trim(),
              isCorrect: correctAnswers.includes(optionTexts[i].trim()),
              order: i,
            },
          });
        }
      }
    }

    return {
      success: true,
      data: questionBank,
      message: `Question bank imported with ${data.length} questions`,
    };
  }

  private async importFromExcel(data: any, userId: string, userRole: Role, courseId?: string) {
    // For Excel import, data should be an array of objects (rows)
    if (!Array.isArray(data)) {
      throw new BadRequestException('Invalid Excel format. Expected array of question objects');
    }

    // Skip metadata rows (first 8 rows) and header row (9th row)
    const questionsData = data.slice(8);

    // Create question bank
    const questionBank = await this.prisma.questionBank.create({
      data: {
        courseId,
        title: `Imported Question Bank ${new Date().toISOString()}`,
        description: 'Imported from Excel',
        topic: 'Imported',
        difficulty: DifficultyLevel.MEDIUM,
        questionType: QuestionType.MULTIPLE_CHOICE, // Default
      },
    });

    // Import questions
    for (const q of questionsData) {
      if (!q.questionText) continue; // Skip empty rows

      const question = await this.prisma.question.create({
        data: {
          questionBankId: questionBank.id,
          type: q.type || QuestionType.MULTIPLE_CHOICE,
          questionText: q.questionText,
          points: parseFloat(q.points) || 1,
          explanation: q.explanation,
        },
      });

      // Import options
      const options = [];
      if (q.option1) options.push({ text: q.option1, isCorrect: q.correctAnswer?.includes('Option 1') });
      if (q.option2) options.push({ text: q.option2, isCorrect: q.correctAnswer?.includes('Option 2') });
      if (q.option3) options.push({ text: q.option3, isCorrect: q.correctAnswer?.includes('Option 3') });
      if (q.option4) options.push({ text: q.option4, isCorrect: q.correctAnswer?.includes('Option 4') });

      for (let i = 0; i < options.length; i++) {
        await this.prisma.questionOption.create({
          data: {
            questionId: question.id,
            optionText: options[i].text,
            isCorrect: options[i].isCorrect,
            order: i,
          },
        });
      }
    }

    return {
      success: true,
      data: questionBank,
      message: `Question bank imported with ${questionsData.filter(q => q.questionText).length} questions`,
    };
  }
}
