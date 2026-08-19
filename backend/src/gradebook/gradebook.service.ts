import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ExamCategory } from '@prisma/client';
import { UpdateGradeDto, UpdateCourseSettingsDto, BulkUpdateGradesDto } from './dto';
import * as ExcelJS from 'exceljs';
import PDFKit from 'pdfkit';
import { AutoValidator } from '../common/base/validation-guide';
import { EnrollmentWithGrade, BulkGradeUpdateResult } from './dto/gradebook.types';

// Heuristic #1: Visibility of System Status — clear error messages
// Heuristic #5: Error Prevention — validation and access control
// Heuristic #16: Instructional Assessment — detailed grade tracking

@Injectable()
export class GradebookService {
  constructor(private prisma: PrismaService) {}

  async getCourseGradebook(courseId: string, userId: string, role: Role) {
    // Check access
    await this.checkCourseAccess(courseId, userId, role);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        settings: true,
        enrollments: {
          where: { role: 'STUDENT' },
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
          select: {
            id: true,
            title: true,
            maxScore: true,
            submissions: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        exams: {
          select: {
            id: true,
            title: true,
            category: true,
            maxScore: true,
            attempts: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const grades = await this.prisma.grade.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        course: {
          id: course.id,
          name: course.name,
          code: course.code,
          settings: course.settings,
        },
        students: course.enrollments.map((enrollment) => ({
          id: enrollment.user.id,
          name: enrollment.user.name,
          email: enrollment.user.email,
          grade: grades.find((g) => g.studentId === enrollment.user.id) || null,
        })),
        assignments: course.assignments,
        exams: course.exams,
      },
    };
  }

  async getStudentGrades(courseId: string, studentId: string, userId: string, role: Role) {
    await this.checkCourseAccess(courseId, userId, role);

    const grade = await this.prisma.grade.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!grade) {
      // Create grade record if it doesn't exist
      return await this.calculateStudentGrade(courseId, studentId);
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { settings: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const assignments = await this.prisma.assignment.findMany({
      where: { courseId },
      include: {
        submissions: {
          where: { studentId },
        },
      },
    });

    const exams = await this.prisma.exam.findMany({
      where: { courseId },
      include: {
        attempts: {
          where: { studentId },
          orderBy: { attemptNumber: 'desc' },
          take: 1,
        },
      },
    });

    return {
      success: true,
      data: {
        grade,
        course: {
          id: course.id,
          name: course.name,
          code: course.code,
          settings: course.settings,
        },
        assignments,
        exams,
      },
    };
  }

  async getMyGrades(courseId: string, userId: string) {
    return this.getStudentGrades(courseId, userId, userId, Role.MAHASISWA);
  }

  async getAllMyGrades(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId, role: 'STUDENT' },
      include: {
        course: {
          include: {
            settings: true,
          },
        },
      },
    });

    const grades = await this.prisma.grade.findMany({
      where: {
        courseId: { in: enrollments.map((e) => e.courseId) },
        studentId: userId,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            settings: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        enrollments: enrollments.map((enrollment): EnrollmentWithGrade => ({
          course: enrollment.course,
          grade: grades.find((g) => g.courseId === enrollment.courseId) || null,
        })),
      },
    };
  }

  async updateGrade(
    courseId: string,
    studentId: string,
    dto: UpdateGradeDto,
    userId: string,
    role: Role,
  ) {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      assignmentScore: { type: 'number', required: false, min: 0, max: 100 },
      quizScore: { type: 'number', required: false, min: 0, max: 100 },
      utsScore: { type: 'number', required: false, min: 0, max: 100 },
      uasScore: { type: 'number', required: false, min: 0, max: 100 },
      otherScore: { type: 'number', required: false, min: 0, max: 100 },
      finalScore: { type: 'number', required: false, min: 0, max: 100 },
      letterGrade: { type: 'string', required: false, maxLength: 2 },
      feedback: { type: 'string', required: false, maxLength: 5000 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate dan normalize IDs
    const validatedCourseId = AutoValidator.validateUUID(courseId, 'Course ID');
    const validatedStudentId = AutoValidator.validateUUID(studentId, 'Student ID');

    await this.checkCourseAccess(validatedCourseId, userId, role);

    const existingGrade = await this.prisma.grade.findUnique({
      where: {
        courseId_studentId: {
          courseId: validatedCourseId,
          studentId: validatedStudentId,
        },
      },
    });

    // Track changes
    const changes = [];
    if (result.sanitized.assignmentScore !== undefined && existingGrade?.assignmentScore !== result.sanitized.assignmentScore) {
      changes.push({ field: 'assignmentScore', old: existingGrade?.assignmentScore, new: result.sanitized.assignmentScore });
    }
    if (result.sanitized.quizScore !== undefined && existingGrade?.quizScore !== result.sanitized.quizScore) {
      changes.push({ field: 'quizScore', old: existingGrade?.quizScore, new: result.sanitized.quizScore });
    }
    if (result.sanitized.utsScore !== undefined && existingGrade?.utsScore !== result.sanitized.utsScore) {
      changes.push({ field: 'utsScore', old: existingGrade?.utsScore, new: result.sanitized.utsScore });
    }
    if (result.sanitized.uasScore !== undefined && existingGrade?.uasScore !== result.sanitized.uasScore) {
      changes.push({ field: 'uasScore', old: existingGrade?.uasScore, new: result.sanitized.uasScore });
    }
    if (result.sanitized.otherScore !== undefined && existingGrade?.otherScore !== result.sanitized.otherScore) {
      changes.push({ field: 'otherScore', old: existingGrade?.otherScore, new: result.sanitized.otherScore });
    }

    // ✅ Update dengan data yang sudah divalidasi
    const grade = await this.prisma.grade.upsert({
      where: {
        courseId_studentId: {
          courseId: validatedCourseId,
          studentId: validatedStudentId,
        },
      },
      create: {
        courseId: validatedCourseId,
        studentId: validatedStudentId,
        ...result.sanitized,
      },
      update: result.sanitized,
    });

    // Create history records for changes
    for (const change of changes) {
      await this.prisma.gradeHistory.create({
        data: {
          gradeId: grade.id,
          changedBy: userId,
          fieldName: change.field,
          oldValue: change.old,
          newValue: change.new,
          changeReason: dto.changeReason,
        },
      });
    }

    // Recalculate final score
    await this.calculateFinalScore(grade.id);

    return {
      success: true,
      data: grade,
      message: 'Grade updated successfully',
    };
  }

  async bulkUpdateGrades(
    courseId: string,
    dto: BulkUpdateGradesDto,
    userId: string,
    role: Role,
  ) {
    await this.checkCourseAccess(courseId, userId, role);

    const results: BulkGradeUpdateResult[] = [];

    for (const gradeUpdate of dto.grades) {
      try {
        const result = await this.updateGrade(
          courseId,
          gradeUpdate.studentId,
          {
            ...gradeUpdate,
            changeReason: dto.changeReason,
          },
          userId,
          role,
        );
        results.push({ studentId: gradeUpdate.studentId, success: true });
      } catch (error) {
        results.push({ studentId: gradeUpdate.studentId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return {
      success: true,
      data: results,
      message: 'Bulk grade update completed',
    };
  }

  async updateCourseSettings(
    courseId: string,
    dto: UpdateCourseSettingsDto,
    userId: string,
    role: Role,
  ) {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      assignmentWeight: { type: 'number', required: false, min: 0, max: 100 },
      quizWeight: { type: 'number', required: false, min: 0, max: 100 },
      utsWeight: { type: 'number', required: false, min: 0, max: 100 },
      uasWeight: { type: 'number', required: false, min: 0, max: 100 },
      otherWeight: { type: 'number', required: false, min: 0, max: 100 },
      passingGrade: { type: 'number', required: false, min: 0, max: 100 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate dan normalize courseId
    const validatedCourseId = AutoValidator.validateUUID(courseId, 'Course ID');

    await this.checkCourseAccess(validatedCourseId, userId, role);

    const settings = await this.prisma.courseSettings.upsert({
      where: { courseId },
      create: {
        courseId,
        ...dto,
      },
      update: dto,
    });

    // Recalculate all grades for the course with new weights
    await this.recalculateGrades(courseId, userId, role);

    return {
      success: true,
      data: settings,
      message: 'Course settings updated successfully',
    };
  }

  async getCourseSettings(courseId: string, userId: string, role: Role) {
    await this.checkCourseAccess(courseId, userId, role);

    const settings = await this.prisma.courseSettings.findUnique({
      where: { courseId },
    });

    return {
      success: true,
      data: settings || {
        courseId,
        passingGrade: 60,
        assignmentWeight: 0.3,
        quizWeight: 0.2,
        utsWeight: 0.2,
        uasWeight: 0.3,
        otherWeight: 0,
      },
    };
  }

  async getCourseStatistics(courseId: string, userId: string, role: Role) {
    await this.checkCourseAccess(courseId, userId, role);

    const grades = await this.prisma.grade.findMany({
      where: { courseId },
    });

    const settings = await this.prisma.courseSettings.findUnique({
      where: { courseId },
    });

    const passingGrade = settings?.passingGrade || 60;

    const totalStudents = grades.length;
    const passedStudents = grades.filter((g) => g.finalScore !== null && g.finalScore >= passingGrade).length;
    const failedStudents = totalStudents - passedStudents;

    const averageScores = {
      assignment: grades.reduce((sum, g) => sum + (g.assignmentScore || 0), 0) / totalStudents || 0,
      quiz: grades.reduce((sum, g) => sum + (g.quizScore || 0), 0) / totalStudents || 0,
      uts: grades.reduce((sum, g) => sum + (g.utsScore || 0), 0) / totalStudents || 0,
      uas: grades.reduce((sum, g) => sum + (g.uasScore || 0), 0) / totalStudents || 0,
      final: grades.reduce((sum, g) => sum + (g.finalScore || 0), 0) / totalStudents || 0,
    };

    const averageCompletion = grades.reduce((sum, g) => sum + g.completionPercentage, 0) / totalStudents || 0;

    return {
      success: true,
      data: {
        totalStudents,
        passedStudents,
        failedStudents,
        passRate: totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0,
        averageScores,
        averageCompletion,
      },
    };
  }

  async getGradeHistory(courseId: string, studentId: string, userId: string, role: Role) {
    await this.checkCourseAccess(courseId, userId, role);

    const grade = await this.prisma.grade.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
    });

    if (!grade) {
      throw new NotFoundException('Grade record not found');
    }

    const history = await this.prisma.gradeHistory.findMany({
      where: { gradeId: grade.id },
      include: {
        changer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { changedAt: 'desc' },
    });

    return {
      success: true,
      data: history,
    };
  }

  async recalculateGrades(courseId: string, userId: string, role: Role) {
    await this.checkCourseAccess(courseId, userId, role);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId, role: 'STUDENT' },
    });

    const results: BulkGradeUpdateResult[] = [];

    for (const enrollment of enrollments) {
      try {
        const grade = await this.calculateStudentGrade(courseId, enrollment.userId);
        results.push({ studentId: enrollment.userId, success: true });
      } catch (error) {
        results.push({ studentId: enrollment.userId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return {
      success: true,
      data: results,
      message: 'Grade recalculation completed',
    };
  }

  async exportGradebook(courseId: string, format: string, userId: string, role: Role) {
    await this.checkCourseAccess(courseId, userId, role);

    const gradebookData = await this.getCourseGradebook(courseId, userId, role);

    if (format === 'csv') {
      return this.generateCsv(gradebookData.data);
    }

    return this.generateExcel(gradebookData.data);
  }

  async exportGradebookPdf(courseId: string, userId: string, role: Role) {
    await this.checkCourseAccess(courseId, userId, role);

    const gradebookData = await this.getCourseGradebook(courseId, userId, role);
    return this.generatePdf(gradebookData.data);
  }

  private async calculateStudentGrade(courseId: string, studentId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { settings: true },
    });

    const settings = course?.settings || {
      passingGrade: 60,
      assignmentWeight: 0.3,
      quizWeight: 0.2,
      utsWeight: 0.2,
      uasWeight: 0.3,
      otherWeight: 0,
    };

    // Calculate assignment score
    const assignments = await this.prisma.assignment.findMany({
      where: { courseId },
      include: {
        submissions: {
          where: { studentId },
        },
      },
    });

    let assignmentTotal = 0;
    let assignmentMaxTotal = 0;
    let completedAssignments = 0;

    for (const assignment of assignments) {
      assignmentMaxTotal += assignment.maxScore;
      const submission = assignment.submissions[0];
      if (submission && submission.score !== null) {
        assignmentTotal += submission.score;
        completedAssignments++;
      }
    }

    const assignmentScore = assignmentMaxTotal > 0 ? (assignmentTotal / assignmentMaxTotal) * 100 : 0;

    // Calculate quiz score
    const quizExams = await this.prisma.exam.findMany({
      where: { courseId, category: ExamCategory.QUIZ },
      include: {
        attempts: {
          where: { studentId },
          orderBy: { attemptNumber: 'desc' },
          take: 1,
        },
      },
    });

    let quizTotal = 0;
    let quizMaxTotal = 0;
    let completedQuizzes = 0;

    for (const quiz of quizExams) {
      quizMaxTotal += quiz.maxScore;
      const attempt = quiz.attempts[0];
      if (attempt && attempt.totalScore !== null) {
        quizTotal += attempt.totalScore;
        completedQuizzes++;
      }
    }

    const quizScore = quizMaxTotal > 0 ? (quizTotal / quizMaxTotal) * 100 : 0;

    // Calculate UTS score
    const utsExam = await this.prisma.exam.findFirst({
      where: { courseId, category: ExamCategory.UTS },
      include: {
        attempts: {
          where: { studentId },
          orderBy: { attemptNumber: 'desc' },
          take: 1,
        },
      },
    });

    const utsScore = utsExam?.attempts[0]?.totalScore
      ? (utsExam.attempts[0].totalScore / utsExam.maxScore) * 100
      : 0;

    // Calculate UAS score
    const uasExam = await this.prisma.exam.findFirst({
      where: { courseId, category: ExamCategory.UAS },
      include: {
        attempts: {
          where: { studentId },
          orderBy: { attemptNumber: 'desc' },
          take: 1,
        },
      },
    });

    const uasScore = uasExam?.attempts[0]?.totalScore
      ? (uasExam.attempts[0].totalScore / uasExam.maxScore) * 100
      : 0;

    // Calculate completion percentage
    const totalActivities = assignments.length + quizExams.length + (utsExam ? 1 : 0) + (uasExam ? 1 : 0);
    const completedActivities = completedAssignments + completedQuizzes + (utsScore > 0 ? 1 : 0) + (uasScore > 0 ? 1 : 0);
    const completionPercentage = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

    // Calculate final score
    const finalScore =
      assignmentScore * settings.assignmentWeight +
      quizScore * settings.quizWeight +
      utsScore * settings.utsWeight +
      uasScore * settings.uasWeight;

    const passed = finalScore >= settings.passingGrade;

    const grade = await this.prisma.grade.upsert({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
      create: {
        courseId,
        studentId,
        assignmentScore,
        quizScore,
        utsScore,
        uasScore,
        finalScore,
        passed,
        completionPercentage,
      },
      update: {
        assignmentScore,
        quizScore,
        utsScore,
        uasScore,
        finalScore,
        passed,
        completionPercentage,
        calculatedAt: new Date(),
      },
    });

    return grade;
  }

  private async calculateFinalScore(gradeId: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { id: gradeId },
      include: { course: { include: { settings: true } } },
    });

    if (!grade) return;

    const settings = grade.course.settings || {
      passingGrade: 60,
      assignmentWeight: 0.3,
      quizWeight: 0.2,
      utsWeight: 0.2,
      uasWeight: 0.3,
      otherWeight: 0,
    };

    const finalScore =
      (grade.assignmentScore || 0) * settings.assignmentWeight +
      (grade.quizScore || 0) * settings.quizWeight +
      (grade.utsScore || 0) * settings.utsWeight +
      (grade.uasScore || 0) * settings.uasWeight +
      (grade.otherScore || 0) * settings.otherWeight;

    const passed = finalScore >= settings.passingGrade;

    await this.prisma.grade.update({
      where: { id: gradeId },
      data: {
        finalScore,
        passed,
        calculatedAt: new Date(),
      },
    });
  }

  private async checkCourseAccess(courseId: string, userId: string, role: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (role === Role.ADMIN) {
      return true;
    }

    if (role === Role.DOSEN) {
      if (course.instructorId !== userId) {
        throw new ForbiddenException('You are not the instructor of this course');
      }
      return true;
    }

    if (role === Role.MAHASISWA) {
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
      return true;
    }

    throw new ForbiddenException('Access denied');
  }

  private async generateExcel(data: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Gradebook');

    // Headers
    worksheet.columns = [
      { header: 'Student Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Assignment Score', key: 'assignmentScore', width: 15 },
      { header: 'Quiz Score', key: 'quizScore', width: 15 },
      { header: 'UTS Score', key: 'utsScore', width: 15 },
      { header: 'UAS Score', key: 'uasScore', width: 15 },
      { header: 'Other Score', key: 'otherScore', width: 15 },
      { header: 'Final Score', key: 'finalScore', width: 15 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Completion %', key: 'completion', width: 15 },
    ];

    // Data rows
    data.students.forEach((student: any) => {
      const grade = student.grade;
      worksheet.addRow({
        name: student.name,
        email: student.email,
        assignmentScore: grade?.assignmentScore || 0,
        quizScore: grade?.quizScore || 0,
        utsScore: grade?.utsScore || 0,
        uasScore: grade?.uasScore || 0,
        otherScore: grade?.otherScore || 0,
        finalScore: grade?.finalScore || 0,
        status: grade?.passed ? 'Passed' : 'Failed',
        completion: grade?.completionPercentage || 0,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      success: true,
      data: {
        buffer: (buffer as unknown as Buffer).toString('base64'),
        filename: `gradebook_${data.course.code}_${new Date().toISOString().split('T')[0]}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    };
  }

  private async generateCsv(data: any) {
    const headers = [
      'Student Name',
      'Email',
      'Assignment Score',
      'Quiz Score',
      'UTS Score',
      'UAS Score',
      'Other Score',
      'Final Score',
      'Status',
      'Completion %',
    ];

    // Helper function to escape CSV values
    const escapeCsvValue = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = data.students.map((student: any) => {
      const grade = student.grade;
      return [
        escapeCsvValue(student.name),
        escapeCsvValue(student.email),
        escapeCsvValue(grade?.assignmentScore || 0),
        escapeCsvValue(grade?.quizScore || 0),
        escapeCsvValue(grade?.utsScore || 0),
        escapeCsvValue(grade?.uasScore || 0),
        escapeCsvValue(grade?.otherScore || 0),
        escapeCsvValue(grade?.finalScore || 0),
        escapeCsvValue(grade?.passed ? 'Passed' : 'Failed'),
        escapeCsvValue(grade?.completionPercentage || 0),
      ].join(',');
    });

    const headerRow = headers.map(escapeCsvValue).join(',');
    const csv = [headerRow, ...rows].join('\n');

    return {
      success: true,
      data: {
        buffer: Buffer.from(csv, 'utf-8').toString('base64'),
        filename: `gradebook_${data.course.code}_${new Date().toISOString().split('T')[0]}.csv`,
        mimeType: 'text/csv; charset=utf-8',
      },
    };
  }

  private async generatePdf(data: any) {
    return new Promise((resolve) => {
      const doc = new PDFKit({
        margin: 30,
        size: 'A4',
        layout: 'landscape',
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          success: true,
          data: {
            buffer: buffer.toString('base64'),
            filename: `gradebook_${data.course.code}_${new Date().toISOString().split('T')[0]}.pdf`,
            mimeType: 'application/pdf',
          },
        });
      });

      // Title
      doc.fontSize(18).font('Helvetica-Bold').text(`Gradebook - ${data.course.name}`, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`Course Code: ${data.course.code}`, { align: 'center' });
      doc.moveDown();

      // Table setup
      const tableTop = doc.y;
      const tableHeaders = ['Student Name', 'Email', 'Assignment', 'Quiz', 'UTS', 'UAS', 'Other', 'Final', 'Status', 'Completion %'];
      const columnWidths = [120, 150, 60, 50, 50, 50, 50, 50, 60, 70];
      const rowHeight = 25;
      const startX = 30;

      // Draw headers
      doc.fontSize(10).font('Helvetica-Bold');
      let xPos = startX;
      tableHeaders.forEach((header, index) => {
        doc.text(header, xPos, tableTop, { width: columnWidths[index], align: 'left' });
        xPos += columnWidths[index];
      });

      // Draw line under headers
      doc.moveTo(startX, tableTop + 20).lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), tableTop + 20).stroke();

      // Draw data rows
      doc.fontSize(9).font('Helvetica');
      let yPos = tableTop + 30;

      data.students.forEach((student: any) => {
        const grade = student.grade;
        const rowData = [
          student.name,
          student.email,
          grade?.assignmentScore?.toFixed(2) || '0.00',
          grade?.quizScore?.toFixed(2) || '0.00',
          grade?.utsScore?.toFixed(2) || '0.00',
          grade?.uasScore?.toFixed(2) || '0.00',
          grade?.otherScore?.toFixed(2) || '0.00',
          grade?.finalScore?.toFixed(2) || '0.00',
          grade?.passed ? 'Passed' : 'Failed',
          `${grade?.completionPercentage?.toFixed(1) || 0}%`,
        ];

        xPos = startX;
        rowData.forEach((cell, index) => {
          doc.text(cell, xPos, yPos, { width: columnWidths[index], align: 'left' });
          xPos += columnWidths[index];
        });

        yPos += rowHeight;

        // Add new page if needed
        if (yPos > 500) {
          doc.addPage();
          yPos = 30;
        }
      });

      doc.end();
    });
  }
}
