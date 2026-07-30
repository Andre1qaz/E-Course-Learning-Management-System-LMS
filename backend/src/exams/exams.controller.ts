import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';

// Heuristic #1: Visibility of System Status — clear API responses
// Heuristic #5: Error Prevention — role-based access control
// Heuristic #16: Instructional Assessment — exam and grading endpoints

@ApiTags('Exams')
@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @Post('course/:courseId')
  @ApiOperation({ summary: 'Create new exam (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateExamDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.examsService.create(courseId, userId, role, dto);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all exams for a course' })
  async findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.examsService.findByCourse(courseId, userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exam by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.examsService.findOne(id, userId, role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update exam (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.examsService.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete exam (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.examsService.remove(id, userId, role);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish exam (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async publish(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.examsService.publish(id, userId, role);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Add question to exam (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async addQuestion(
    @Param('id') examId: string,
    @Body() dto: CreateQuestionDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.examsService.addQuestion(examId, userId, role, dto);
  }

  @Post('attempts/:attemptId/auto-save')
  @ApiOperation({ summary: 'Auto-save answer during exam (Student only)' })
  @Roles(Role.ADMIN, Role.DOSEN, Role.MAHASISWA)
  async autoSaveAnswer(
    @Param('attemptId') attemptId: string,
    @Body() dto: any,
    @CurrentUser('sub') userId: string,
  ) {
    return this.examsService.autoSaveAnswer(attemptId, userId, dto);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get all questions for an exam' })
  async getQuestions(
    @Param('id') examId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.examsService.getQuestions(examId, userId, role);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start exam attempt (Students only)' })
  @Roles(Role.MAHASISWA)
  async startAttempt(
    @Param('id') examId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.examsService.startAttempt(examId, userId);
  }

  @Post('attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Submit exam attempt (Students only)' })
  @Roles(Role.MAHASISWA)
  async submitAttempt(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitExamDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.examsService.submitAttempt(attemptId, userId, dto);
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: 'Get exam attempt by ID' })
  async getAttempt(
    @Param('attemptId') attemptId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.examsService.getAttempt(attemptId, userId, role);
  }

  @Get(':id/attempts')
  @ApiOperation({ summary: 'Get all attempts for an exam (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async getAttempts(
    @Param('id') examId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.examsService.getAttempts(examId, userId, role);
  }

  @Post('attempts/:attemptId/grade')
  @ApiOperation({ summary: 'Grade exam attempt manually (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async gradeAttempt(
    @Param('attemptId') attemptId: string,
    @Body() dto: { answers: Array<{ questionId: string; score: number; feedback?: string }> },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.examsService.gradeAttempt(attemptId, userId, role, dto);
  }

  @Post(':id/questions/reorder')
  @ApiOperation({ summary: 'Reorder questions in an exam (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async reorderQuestions(
    @Param('id') examId: string,
    @Body() dto: { questionOrders: { id: string; order: number }[] },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.examsService.reorderQuestions(examId, userId, role, dto.questionOrders);
  }
}
