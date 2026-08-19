import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
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
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  EnrollCourseDto,
  DirectEnrollDto,
  UpdateEnrollmentKeyDto,
} from './dto';

// Heuristic #1: Visibility of System Status — clear API responses
// Heuristic #5: Error Prevention — role-based access control
// Heuristic #6: Recognition Rather Than Recall — explicit endpoints

@ApiTags('Courses')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Daftar course untuk dashboard' })
  async getDashboard(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.coursesService.findAll(userId, role);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get all available courses for students to enroll' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @Roles(Role.MAHASISWA)
  async getAvailableCourses(
    @CurrentUser('sub') userId: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.coursesService.getAvailableCourses(userId, {
      search,
      categoryId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  async findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.coursesService.findAll(userId, role, {
      search,
      categoryId,
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.coursesService.findOne(id, userId, role);
  }

  @Post()
  @ApiOperation({ summary: 'Create new course (Admin/Dosen only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async create(
    @Body() dto: CreateCourseDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.coursesService.create(userId, role, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update course (Admin/instructor only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.coursesService.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete course (Admin/instructor only)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.coursesService.remove(id, userId, role);
  }

  @Post('enroll')
  @ApiOperation({ summary: 'Enroll in course using code (Students only)' })
  @Roles(Role.MAHASISWA)
  async enroll(
    @Body() dto: EnrollCourseDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.coursesService.enroll(userId, dto);
  }

  @Post(':courseId/unenroll')
  @ApiOperation({ summary: 'Unenroll from course (Students only)' })
  @Roles(Role.MAHASISWA)
  async unenroll(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.coursesService.unenroll(userId, courseId);
  }

  @Post(':courseId/direct-enroll')
  @ApiOperation({ summary: 'Direct enrollment by Admin/Lecturer' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async directEnroll(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: DirectEnrollDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.coursesService.directEnroll(courseId, userId, role, dto);
  }

  @Put(':courseId/enrollment-key')
  @ApiOperation({ summary: 'Update enrollment key (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async updateEnrollmentKey(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: UpdateEnrollmentKeyDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.coursesService.updateEnrollmentKey(courseId, userId, role, dto);
  }

  @Get(':courseId/participants')
  @ApiOperation({ summary: 'Get course participants (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async getParticipants(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.coursesService.getParticipants(courseId, userId, role);
  }

  @Delete(':courseId/participants/:participantId')
  @ApiOperation({
    summary: 'Remove participant from course (Admin/instructor only)',
  })
  @Roles(Role.ADMIN, Role.DOSEN)
  async removeParticipant(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.coursesService.removeParticipant(
      courseId,
      participantId,
      userId,
      role,
    );
  }
}
