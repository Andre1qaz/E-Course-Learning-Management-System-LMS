import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RubricsService } from './rubrics.service';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubric.dto';
import { SubmitRubricAssessmentDto } from './dto/submit-rubric-assessment.dto';

// Heuristic #1: Visibility of System Status — clear API responses
// Heuristic #5: Error Prevention — role-based access control
// Heuristic #16: Instructional Assessment — rubric management endpoints

@ApiTags('Rubrics')
@Controller('rubrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RubricsController {
  constructor(private rubricsService: RubricsService) {}

  @Post('assignment/:assignmentId')
  @ApiOperation({ summary: 'Create rubric for assignment (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async create(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: CreateRubricDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.rubricsService.create(assignmentId, userId, role, dto);
  }

  @Get('assignment/:assignmentId')
  @ApiOperation({ summary: 'Get rubric for assignment' })
  async findByAssignment(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.rubricsService.findByAssignment(assignmentId, userId, role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update rubric (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRubricDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.rubricsService.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete rubric (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.rubricsService.remove(id, userId, role);
  }

  @Post('submissions/:submissionId/assess')
  @ApiOperation({ summary: 'Submit rubric assessment (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async submitAssessment(
    @Param('submissionId') submissionId: string,
    @Body() dto: SubmitRubricAssessmentDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.rubricsService.submitAssessment(submissionId, userId, role, dto);
  }

  @Get('submissions/:submissionId/assessment')
  @ApiOperation({ summary: 'Get rubric assessment for submission' })
  async getAssessment(
    @Param('submissionId') submissionId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.rubricsService.getAssessment(submissionId, userId, role);
  }
}
