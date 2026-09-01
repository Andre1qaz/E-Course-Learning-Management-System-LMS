import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ParseEntityIdPipe } from '../common/pipes/parse-entity-id.pipe';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';

@ApiTags('Quizzes')
@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Post('activity/:activityId')
  @ApiOperation({ summary: 'Create new quiz (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async create(
    @Param('activityId', ParseEntityIdPipe) activityId: string,
    @Body() dto: CreateQuizDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.quizzesService.create(activityId, userId, role, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID' })
  async findOne(
    @Param('id', ParseEntityIdPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.quizzesService.findOne(id, userId, role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update quiz (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async update(
    @Param('id', ParseEntityIdPipe) id: string,
    @Body() dto: UpdateQuizDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.quizzesService.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quiz (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async remove(
    @Param('id', ParseEntityIdPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.quizzesService.remove(id, userId, role);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Add question to quiz (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async addQuestion(
    @Param('id', ParseEntityIdPipe) id: string,
    @Body() dto: CreateQuizQuestionDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.quizzesService.addQuestion(id, userId, role, dto);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get quiz questions' })
  async getQuestions(
    @Param('id', ParseEntityIdPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.quizzesService.getQuestions(id, userId, role);
  }

  @Post(':id/attempts/start')
  @ApiOperation({ summary: 'Start quiz attempt (students only)' })
  @Roles(Role.MAHASISWA)
  async startAttempt(
    @Param('id', ParseEntityIdPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.quizzesService.startAttempt(id, userId, role);
  }

  @Post('attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Submit quiz attempt (students only)' })
  @Roles(Role.MAHASISWA)
  async submitAttempt(
    @Param('attemptId', ParseEntityIdPipe) attemptId: string,
    @Body() answers: { questionId: string; answerText?: string; selectedOptionId?: string }[],
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.quizzesService.submitAttempt(attemptId, userId, role, answers);
  }

  @Get(':id/attempts/student')
  @ApiOperation({ summary: 'Get student attempts for a quiz' })
  async getStudentAttempts(
    @Param('id', ParseEntityIdPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.quizzesService.getStudentAttempts(id, userId, role);
  }

  @Get(':id/attempts/all')
  @ApiOperation({ summary: 'Get all attempts for a quiz (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async getAllAttempts(
    @Param('id', ParseEntityIdPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.quizzesService.getAllAttempts(id, userId, role);
  }
}