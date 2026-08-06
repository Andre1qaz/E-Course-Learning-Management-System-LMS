import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CourseProgressService } from './course-progress.service';
import { RecalculateProgressDto } from './dto/course-progress.dto';

@ApiTags('Course Progress')
@Controller('course-progress')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CourseProgressController {
  constructor(private courseProgressService: CourseProgressService) {}

  @Get('student/my-courses')
  @ApiOperation({ summary: 'Get progress for all courses of current student' })
  @Roles(Role.MAHASISWA)
  async getMyCourseProgress(@CurrentUser('sub') userId: string) {
    return {
      success: true,
      data: await this.courseProgressService.getStudentAllCoursesProgress(userId),
      message: 'Student course progress retrieved successfully',
    };
  }

  @Get('student/course/:courseId')
  @ApiOperation({ summary: 'Get progress for a specific course (student view)' })
  @Roles(Role.MAHASISWA)
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  async getStudentCourseProgress(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return {
      success: true,
      data: await this.courseProgressService.calculateStudentProgress(
        courseId,
        userId,
      ),
      message: 'Course progress retrieved successfully',
    };
  }

  @Get('lecturer/course/:courseId/students')
  @ApiOperation({ summary: 'Get progress for all students in a course (lecturer view)' })
  @Roles(Role.DOSEN, Role.ADMIN)
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  async getCourseStudentsProgress(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return {
      success: true,
      data: await this.courseProgressService.getCourseStudentsProgress(courseId),
      message: 'Course students progress retrieved successfully',
    };
  }

  @Get('lecturer/course/:courseId/student/:studentId')
  @ApiOperation({ summary: 'Get progress for a specific student in a course' })
  @Roles(Role.DOSEN, Role.ADMIN)
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  async getStudentProgressInCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return {
      success: true,
      data: await this.courseProgressService.calculateStudentProgress(
        courseId,
        studentId,
      ),
      message: 'Student progress retrieved successfully',
    };
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Get system-wide progress statistics (admin view)' })
  @Roles(Role.ADMIN)
  async getSystemProgressStats() {
    return {
      success: true,
      data: await this.courseProgressService.getSystemProgressStats(),
      message: 'System progress statistics retrieved successfully',
    };
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Recalculate progress for a course' })
  @Roles(Role.DOSEN, Role.ADMIN)
  async recalculateProgress(@Body() dto: RecalculateProgressDto) {
    const result = await this.courseProgressService.recalculateProgress(
      dto.courseId,
      dto.studentId,
    );
    return {
      success: true,
      data: result,
      message: 'Progress recalculated successfully',
    };
  }
}
