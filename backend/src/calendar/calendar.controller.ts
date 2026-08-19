import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
import { Role, EventCategory } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

// Heuristic #1: Visibility of System Status — clear API responses for calendar operations
// Heuristic #5: Error Prevention — validate event data before processing
// Heuristic #6: Recognition Rather Than Recall — provide clear endpoint naming

@ApiTags('Calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: 'Get all calendar events for current user' })
  @ApiQuery({
    name: 'courseId',
    required: false,
    description: 'Filter by course ID',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by event category',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter by start date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter by end date',
  })
  async getUserEvents(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Query('courseId') courseId?: string,
    @Query('category') category?: EventCategory,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.calendarService.getUserEvents(userId, role, {
      courseId,
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('month')
  @ApiOperation({ summary: 'Get calendar events for a specific month' })
  @ApiQuery({ name: 'year', required: true, description: 'Year (e.g., 2025)' })
  @ApiQuery({ name: 'month', required: true, description: 'Month (1-12)' })
  async getEventsByMonth(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.calendarService.getEventsByMonth(
      userId,
      role,
      parseInt(year),
      parseInt(month),
    );
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events (next 7 days)' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days ahead (default: 7)',
  })
  async getUpcomingEvents(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Query('days') days?: string,
  ) {
    return this.calendarService.getUpcomingEvents(
      userId,
      role,
      days ? parseInt(days) : 7,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  async getEventById(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id', ParseUUIDPipe) eventId: string,
  ) {
    return this.calendarService.getEventById(eventId, userId, role);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new calendar event' })
  async createEvent(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.calendarService.createEvent(userId, role, {
      title: createEventDto.title,
      description: createEventDto.description,
      startDate: new Date(createEventDto.startDate),
      endDate: createEventDto.endDate
        ? new Date(createEventDto.endDate)
        : undefined,
      startTime: createEventDto.startTime,
      endTime: createEventDto.endTime,
      location: createEventDto.location,
      isOnline: createEventDto.isOnline,
      meetingLink: createEventDto.meetingLink,
      category: createEventDto.category,
      color: createEventDto.color,
      type: createEventDto.type,
      targetAudience: createEventDto.targetAudience,
      relatedActivityType: createEventDto.relatedActivityType,
      relatedActivityId: createEventDto.relatedActivityId,
      isPublished: createEventDto.isPublished,
      attachments: createEventDto.attachments,
      courseId: createEventDto.courseId,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a calendar event' })
  async updateEvent(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.calendarService.updateEvent(userId, role, eventId, {
      title: updateEventDto.title,
      description: updateEventDto.description,
      startDate: updateEventDto.startDate
        ? new Date(updateEventDto.startDate)
        : undefined,
      endDate: updateEventDto.endDate
        ? new Date(updateEventDto.endDate)
        : undefined,
      startTime: updateEventDto.startTime,
      endTime: updateEventDto.endTime,
      location: updateEventDto.location,
      isOnline: updateEventDto.isOnline,
      meetingLink: updateEventDto.meetingLink,
      category: updateEventDto.category,
      color: updateEventDto.color,
      type: updateEventDto.type,
      targetAudience: updateEventDto.targetAudience,
      relatedActivityType: updateEventDto.relatedActivityType,
      relatedActivityId: updateEventDto.relatedActivityId,
      isPublished: updateEventDto.isPublished,
      attachments: updateEventDto.attachments,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a calendar event' })
  async deleteEvent(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id', ParseUUIDPipe) eventId: string,
  ) {
    return this.calendarService.deleteEvent(userId, role, eventId);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Toggle event publish status' })
  async toggleEventPublish(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id', ParseUUIDPipe) eventId: string,
  ) {
    return this.calendarService.toggleEventPublish(userId, role, eventId);
  }
}
