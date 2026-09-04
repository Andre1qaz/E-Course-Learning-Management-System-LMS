import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParseEntityIdPipe } from '../common/pipes/parse-entity-id.pipe';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GradebookService } from './gradebook.service';
import { GradebookQueueService } from './gradebook-queue.service';
import {
  UpdateGradeDto,
  UpdateCourseSettingsDto,
  BulkUpdateGradesDto,
} from './dto';

// Heuristic #1: Visibility of System Status — clear API responses
// Heuristic #5: Error Prevention — role-based access control
// Heuristic #6: Recognition Rather Than Recall — explicit endpoints

@ApiTags('Gradebook')
@Controller('gradebook')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GradebookController {
  constructor(
    private gradebookService: GradebookService,
    private gradebookQueueService: GradebookQueueService,
  ) {}

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get gradebook for a course (Admin/Lecturer only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async getCourseGradebook(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradebookService.getCourseGradebook(courseId, userId, role);
  }

  @Get('course/:courseId/student/:studentId')
  @ApiOperation({
    summary: 'Get student grades in a course (Admin/Lecturer only)',
  })
  @Roles(Role.ADMIN, Role.DOSEN)
  async getStudentGrades(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @Param('studentId', ParseEntityIdPipe) studentId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradebookService.getStudentGrades(
      courseId,
      studentId,
      userId,
      role,
    );
  }

  @Get('my-grades/:courseId')
  @ApiOperation({
    summary: 'Get current user grades for a course (Students only)',
  })
  @Roles(Role.MAHASISWA)
  async getMyGrades(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.gradebookService.getMyGrades(courseId, userId);
  }

  @Get('my-grades')
  @ApiOperation({
    summary: 'Get all grades for current student (Students only)',
  })
  @Roles(Role.MAHASISWA)
  async getAllMyGrades(@CurrentUser('sub') userId: string) {
    return this.gradebookService.getAllMyGrades(userId);
  }

  @Put('course/:courseId/student/:studentId')
  @ApiOperation({ summary: 'Update student grade (Admin/Lecturer only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async updateGrade(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @Param('studentId', ParseEntityIdPipe) studentId: string,
    @Body() dto: UpdateGradeDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradebookService.updateGrade(
      courseId,
      studentId,
      dto,
      userId,
      role,
    );
  }

  @Post('course/:courseId/bulk-update')
  @ApiOperation({ summary: 'Bulk update grades (Admin/Lecturer only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async bulkUpdateGrades(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @Body() dto: BulkUpdateGradesDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradebookService.bulkUpdateGrades(courseId, dto, userId, role);
  }

  @Put('course/:courseId/settings')
  @ApiOperation({
    summary: 'Update course grading settings (Admin/Lecturer only)',
  })
  @Roles(Role.ADMIN, Role.DOSEN)
  async updateCourseSettings(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @Body() dto: UpdateCourseSettingsDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradebookService.updateCourseSettings(
      courseId,
      dto,
      userId,
      role,
    );
  }

  @Get('course/:courseId/settings')
  @ApiOperation({ summary: 'Get course grading settings' })
  async getCourseSettings(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradebookService.getCourseSettings(courseId, userId, role);
  }

  @Get('course/:courseId/statistics')
  @ApiOperation({
    summary: 'Get grade statistics for a course (Admin/Lecturer only)',
  })
  @Roles(Role.ADMIN, Role.DOSEN)
  async getCourseStatistics(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradebookService.getCourseStatistics(courseId, userId, role);
  }

  @Get('course/:courseId/history/:studentId')
  @ApiOperation({
    summary: 'Get grade change history for a student (Admin/Lecturer only)',
  })
  @Roles(Role.ADMIN, Role.DOSEN)
  async getGradeHistory(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @Param('studentId', ParseEntityIdPipe) studentId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradebookService.getGradeHistory(
      courseId,
      studentId,
      userId,
      role,
    );
  }

  @Post('course/:courseId/recalculate')
  @ApiOperation({
    summary: 'Recalculate all grades for a course (Admin/Lecturer only)',
  })
  @Roles(Role.ADMIN, Role.DOSEN)
  async recalculateGrades(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradebookService.recalculateGrades(courseId, userId, role);
  }

  @Get('course/:courseId/export')
  @ApiOperation({ summary: 'Export gradebook to Excel (Admin/Lecturer only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['excel', 'csv'],
    description: 'Export format',
  })
  async exportGradebook(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @Query('format') format: string = 'excel',
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradebookService.exportGradebook(
      courseId,
      format,
      userId,
      role,
    );
  }

  @Get('course/:courseId/export/pdf')
  @ApiOperation({ summary: 'Export gradebook to PDF (Admin/Lecturer only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async exportGradebookPdf(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradebookService.exportGradebookPdf(courseId, userId, role);
  }

  @Post('course/:courseId/export/queue')
  @ApiOperation({ summary: 'Export gradebook via queue (Admin/Lecturer only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async exportGradebookQueue(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @Body() body: { format: 'excel' | 'csv' },
    @CurrentUser('sub') userId: string,
  ) {
    const job = await this.gradebookQueueService.addExportJob({
      courseId,
      userId,
      format: body.format || 'excel',
    });

    if (!job) {
      return {
        success: false,
        message: 'Export job could not be queued - Redis not available',
      };
    }

    return {
      success: true,
      data: {
        jobId: job.id,
        message: 'Export job queued successfully',
      },
      message: 'Export job queued successfully',
    };
  }

  @Get('queue/stats')
  @ApiOperation({ summary: 'Get gradebook queue statistics (Admin only)' })
  @Roles(Role.ADMIN)
  async getQueueStats() {
    return {
      success: true,
      data: await this.gradebookQueueService.getQueueStats(),
      message: 'Queue statistics retrieved successfully',
    };
  }

  @Get('queue/job/:jobId')
  @ApiOperation({ summary: 'Get job status (Admin only)' })
  @Roles(Role.ADMIN)
  async getJobStatus(@Param('jobId', ParseEntityIdPipe) jobId: string) {
    const status = await this.gradebookQueueService.getJobStatus(jobId);

    if (!status) {
      return {
        success: false,
        data: null,
        message: 'Job not found',
      };
    }

    return {
      success: true,
      data: status,
      message: 'Job status retrieved successfully',
    };
  }
}
