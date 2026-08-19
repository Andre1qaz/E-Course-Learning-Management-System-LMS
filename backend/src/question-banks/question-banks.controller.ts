import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { QuestionBanksService } from './question-banks.service';
import {
  CreateQuestionBankDto,
  UpdateQuestionBankDto,
} from './dto/question-bank.dto';
import type { Response } from 'express';

@ApiTags('Question Banks')
@Controller('question-banks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuestionBanksController {
  constructor(private readonly questionBanksService: QuestionBanksService) {}

  @Post()
  @ApiOperation({ summary: 'Create new question bank (Admin/Dosen only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async create(
    @Body() dto: CreateQuestionBankDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.questionBanksService.create(userId, role, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all question banks (Admin/Dosen only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.questionBanksService.findAll(userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question bank by ID (Admin/Dosen only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.questionBanksService.findOne(id, userId, role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update question bank (Admin/Dosen only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionBankDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.questionBanksService.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete question bank (Admin/Dosen only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.questionBanksService.delete(id, userId, role);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Add question to question bank (Admin/Dosen only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async addQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.questionBanksService.addQuestion(id, userId, role, dto);
  }

  @Delete('questions/:questionId')
  @ApiOperation({
    summary: 'Remove question from question bank (Admin/Dosen only)',
  })
  @Roles(Role.ADMIN, Role.DOSEN)
  async removeQuestion(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.questionBanksService.removeQuestion(questionId, userId, role);
  }

  @Post(':id/import/:examId')
  @ApiOperation({
    summary: 'Import questions from bank to exam (Admin/Dosen only)',
  })
  @Roles(Role.ADMIN, Role.DOSEN)
  async importFromBank(
    @Param('id', ParseUUIDPipe) questionBankId: string,
    @Param('examId', ParseUUIDPipe) examId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.questionBanksService.importFromBank(
      questionBankId,
      examId,
      userId,
      role,
    );
  }

  @Get(':id/export/:format')
  @ApiOperation({ summary: 'Export question bank (Admin/Dosen only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async exportQuestionBank(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('format') format: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Res() res: Response,
  ) {
    return this.questionBanksService.exportQuestionBank(
      id,
      userId,
      role,
      format,
      res,
    );
  }

  @Post('import')
  @ApiOperation({ summary: 'Import question bank (Admin/Dosen only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async importQuestionBank(
    @Body() body: { format: string; data: any; courseId?: string },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.questionBanksService.importQuestionBank(
      body.format,
      body.data,
      userId,
      role,
      body.courseId,
    );
  }
}
