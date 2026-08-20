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
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

// Heuristic #1: Visibility of System Status — clear API responses
// Heuristic #5: Error Prevention — role-based access control
// Heuristic #16: Instructional Assessment — grading endpoints

@ApiTags('Assignments')
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Post('course/:courseId')
  @ApiOperation({ summary: 'Create new assignment (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async create(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @Body() dto: CreateAssignmentDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.assignmentsService.create(courseId, userId, role, dto);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all assignments for a course' })
  async findByCourse(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.assignmentsService.findByCourse(courseId, userId, role);
  }

  @Get('gradebook/:courseId')
  @ApiOperation({
    summary: 'Get gradebook for a course (Admin/instructor only)',
  })
  @Roles(Role.ADMIN, Role.DOSEN)
  async getGradebook(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.assignmentsService.getGradebook(courseId, userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  async findOne(
    @Param('id', ParseEntityIdPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.assignmentsService.findOne(id, userId, role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update assignment (Admin/instructor only)' })
  async update(
    @Param('id', ParseEntityIdPipe) id: string,
    @Body() dto: UpdateAssignmentDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.assignmentsService.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete assignment (Admin/instructor only)' })
  async remove(
    @Param('id', ParseEntityIdPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.assignmentsService.remove(id, userId, role);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit assignment (Students only)' })
  @Roles(Role.MAHASISWA)
  async submit(
    @Param('id', ParseEntityIdPipe) id: string,
    @Body() dto: SubmitAssignmentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.assignmentsService.submit(
      id,
      userId,
      dto.fileUrl,
      dto.fileName,
    );
  }

  @Get(':id/submissions')
  @ApiOperation({
    summary: 'Get all submissions for an assignment (Admin/instructor only)',
  })
  @Roles(Role.ADMIN, Role.DOSEN)
  async getSubmissions(
    @Param('id', ParseEntityIdPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.assignmentsService.getSubmissions(id, userId, role);
  }

  @Get(':id/my-submission')
  @ApiOperation({ summary: "Get student's submission for an assignment" })
  async getStudentSubmission(
    @Param('id', ParseEntityIdPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.assignmentsService.getStudentSubmission(id, userId);
  }

  @Post('submissions/:submissionId/grade')
  @ApiOperation({
    summary: 'Grade assignment submission (Admin/instructor only)',
  })
  @Roles(Role.ADMIN, Role.DOSEN)
  async grade(
    @Param('submissionId', ParseEntityIdPipe) submissionId: string,
    @Body() dto: GradeAssignmentDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.assignmentsService.grade(submissionId, userId, role, dto);
  }
}
