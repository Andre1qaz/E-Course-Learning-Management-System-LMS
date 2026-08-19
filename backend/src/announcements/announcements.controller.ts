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
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all announcements for current user' })
  @ApiQuery({
    name: 'courseId',
    required: false,
    description: 'Filter by course ID',
  })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    description: 'Show only unread announcements',
  })
  async getAnnouncements(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Query('courseId') courseId?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.announcementsService.getAnnouncements(userId, role, {
      courseId,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread announcement count' })
  async getUnreadCount(@CurrentUser('sub') userId: string) {
    return this.announcementsService.getUnreadCount(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement by ID' })
  async getAnnouncementById(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.announcementsService.getAnnouncementById(id, userId, role);
  }

  @Post()
  @ApiOperation({ summary: 'Create new announcement (Admin/Lecturer only)' })
  @Roles(Role.ADMIN, Role.DOSEN)
  async createAnnouncement(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.announcementsService.createAnnouncement(userId, role, {
      title: dto.title,
      content: dto.content,
      attachments: dto.attachments,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      isPublished: dto.isPublished,
      priority: dto.priority,
      courseId: dto.courseId,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update announcement (Admin/author only)' })
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.announcementsService.updateAnnouncement(id, userId, role, {
      title: dto.title,
      content: dto.content,
      attachments: dto.attachments,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      isPublished: dto.isPublished,
      priority: dto.priority,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete announcement (Admin/author only)' })
  async deleteAnnouncement(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.announcementsService.deleteAnnouncement(id, userId, role);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark announcement as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.announcementsService.markAsRead(id, userId);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all announcements as read' })
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    return this.announcementsService.markAllAsRead(userId);
  }
}
