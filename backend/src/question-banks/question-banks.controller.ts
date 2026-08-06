import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { QuestionBanksService } from './question-banks.service';
import type { Response } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    role: Role;
  };
}

@Controller('question-banks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionBanksController {
  constructor(private readonly questionBanksService: QuestionBanksService) {}

  @Post()
  @Roles(Role.ADMIN, Role.DOSEN)
  async create(@Request() req: RequestWithUser, @Body() dto: any) {
    return this.questionBanksService.create(req.user.userId, req.user.role, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DOSEN)
  async findAll(@Request() req: RequestWithUser) {
    return this.questionBanksService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DOSEN)
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.questionBanksService.findOne(id, req.user.userId, req.user.role);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DOSEN)
  async update(@Request() req: RequestWithUser, @Param('id') id: string, @Body() dto: any) {
    return this.questionBanksService.update(id, req.user.userId, req.user.role, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.DOSEN)
  async delete(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.questionBanksService.delete(id, req.user.userId, req.user.role);
  }

  @Post(':id/questions')
  @Roles(Role.ADMIN, Role.DOSEN)
  async addQuestion(@Request() req: RequestWithUser, @Param('id') id: string, @Body() dto: any) {
    return this.questionBanksService.addQuestion(id, req.user.userId, req.user.role, dto);
  }

  @Delete('questions/:questionId')
  @Roles(Role.ADMIN, Role.DOSEN)
  async removeQuestion(@Request() req: RequestWithUser, @Param('questionId') questionId: string) {
    return this.questionBanksService.removeQuestion(questionId, req.user.userId, req.user.role);
  }

  @Post(':id/import/:examId')
  @Roles(Role.ADMIN, Role.DOSEN)
  async importFromBank(@Request() req: RequestWithUser, @Param('id') questionBankId: string, @Param('examId') examId: string) {
    return this.questionBanksService.importFromBank(questionBankId, examId, req.user.userId, req.user.role);
  }

  @Get(':id/export/:format')
  @Roles(Role.ADMIN, Role.DOSEN)
  async exportQuestionBank(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('format') format: string,
    @Res() res: Response,
  ) {
    return this.questionBanksService.exportQuestionBank(id, req.user.userId, req.user.role, format, res);
  }

  @Post('import')
  @Roles(Role.ADMIN, Role.DOSEN)
  async importQuestionBank(
    @Request() req: RequestWithUser,
    @Body() body: { format: string; data: any; courseId?: string },
  ) {
    return this.questionBanksService.importQuestionBank(body.format, body.data, req.user.userId, req.user.role, body.courseId);
  }
}
