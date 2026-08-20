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
import { ModulesService } from './modules.service';
import { CreateModuleDto, UpdateModuleDto, CreateModuleFileDto } from './dto';

// Heuristic #1: Visibility of System Status — clear API responses
// Heuristic #5: Error Prevention — role-based access control
// Heuristic #12: Clarity of Purpose and Objectives — learning objectives in responses

@ApiTags('Modules')
@Controller('modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ModulesController {
  constructor(private modulesService: ModulesService) {}

  @Post('course/:courseId')
  @ApiOperation({ summary: 'Create new module (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async create(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @Body() dto: CreateModuleDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.modulesService.create(courseId, userId, role, dto);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all modules for a course' })
  async findByCourse(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.modulesService.findByCourse(courseId, userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get module by ID' })
  async findOne(
    @Param('id', ParseEntityIdPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.modulesService.findOne(id, userId, role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update module (Admin/instructor only)' })
  async update(
    @Param('id', ParseEntityIdPipe) id: string,
    @Body() dto: UpdateModuleDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.modulesService.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete module (Admin/instructor only)' })
  async remove(
    @Param('id', ParseEntityIdPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.modulesService.remove(id, userId, role);
  }

  @Post(':moduleId/files')
  @ApiOperation({ summary: 'Add file to module (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async addFile(
    @Param('moduleId', ParseEntityIdPipe) moduleId: string,
    @Body() dto: CreateModuleFileDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.modulesService.addFile(moduleId, userId, role, dto);
  }

  @Delete('files/:fileId')
  @ApiOperation({ summary: 'Delete file from module (Admin/instructor only)' })
  async removeFile(
    @Param('fileId', ParseEntityIdPipe) fileId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.modulesService.removeFile(fileId, userId, role);
  }

  @Post('course/:courseId/reorder')
  @ApiOperation({ summary: 'Reorder modules (Admin/instructor only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async reorder(
    @Param('courseId', ParseEntityIdPipe) courseId: string,
    @Body() body: { moduleOrders: { id: string; order: number }[] },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.modulesService.reorder(
      courseId,
      userId,
      role,
      body.moduleOrders,
    );
  }
}
