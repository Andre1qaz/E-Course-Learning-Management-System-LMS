import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { StorageService } from '../storage/storage.service';

@ApiTags('activities')
@Controller('weeks/:weekId/activities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all activities for a week' })
  @ApiParam({ name: 'weekId', description: 'Week ID' })
  findAll(
    @Param('weekId') weekId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.activitiesService.findByWeek(weekId, userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific activity' })
  @ApiParam({ name: 'weekId', description: 'Week ID' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.activitiesService.findOne(id, userId, role);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({ summary: 'Create a new activity (Admin/Dosen only)' })
  @ApiParam({ name: 'weekId', description: 'Week ID' })
  create(
    @Param('weekId') weekId: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.activitiesService.create(weekId, dto, userId, role);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({ summary: 'Update an activity (Admin/Dosen only)' })
  @ApiParam({ name: 'weekId', description: 'Week ID' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.activitiesService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({ summary: 'Delete an activity (Admin/Dosen only)' })
  @ApiParam({ name: 'weekId', description: 'Week ID' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.activitiesService.remove(id, userId, role);
  }

  @Post(':id/duplicate')
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({ summary: 'Duplicate an activity (Admin/Dosen only)' })
  @ApiParam({ name: 'weekId', description: 'Week ID' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  duplicate(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.activitiesService.duplicate(id, userId, role);
  }

  @Post(':id/move')
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({
    summary: 'Move an activity to another week (Admin/Dosen only)',
  })
  @ApiParam({ name: 'weekId', description: 'Week ID' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  move(
    @Param('id') id: string,
    @Body() body: { newWeekId: string },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.activitiesService.move(id, body.newWeekId, userId, role);
  }

  @Post('reorder')
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({ summary: 'Reorder activities (Admin/Dosen only)' })
  @ApiParam({ name: 'weekId', description: 'Week ID' })
  reorder(
    @Param('weekId') weekId: string,
    @Body() body: { activityOrders: { id: string; order: number }[] },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.activitiesService.reorder(
      weekId,
      body.activityOrders,
      userId,
      role,
    );
  }

  @Post('upload-url')
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({
    summary: 'Generate upload URL for material files (Admin/Dosen only)',
  })
  @ApiParam({ name: 'weekId', description: 'Week ID' })
  async generateUploadUrl(
    @Param('weekId') weekId: string,
    @Body() body: { fileName: string; fileType: string; fileSize: number },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    const { uploadUrl, fileUrl } = await this.storageService.generateUploadUrl(
      body.fileName,
      body.fileType,
      body.fileSize,
      false, // public files for course materials
    );
    return {
      success: true,
      data: { uploadUrl, fileUrl },
      message: 'Upload URL generated successfully',
    };
  }
}

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ActivitiesGlobalController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post('reorder')
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({ summary: 'Reorder activities globally (Admin/Dosen only)' })
  reorderGlobal(
    @Body() body: { activities: { id: string; order: number }[] },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.activitiesService.reorderGlobal(body.activities, userId, role);
  }

  @Post(':id/publish')
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({ summary: 'Publish an activity (Admin/Dosen only)' })
  @ApiParam({ name: 'weekId', description: 'Week ID' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  publish(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.activitiesService.publish(id, userId, role);
  }

  @Post(':id/unpublish')
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({ summary: 'Unpublish an activity (Admin/Dosen only)' })
  @ApiParam({ name: 'weekId', description: 'Week ID' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  unpublish(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.activitiesService.unpublish(id, userId, role);
  }
}
