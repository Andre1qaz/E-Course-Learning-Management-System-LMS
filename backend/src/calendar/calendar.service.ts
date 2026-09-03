import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActivityStatus,
  ActivityType,
  CalendarEventType,
  EventCategory,
  EventTargetAudience,
  RelatedActivityType,
  Role,
  ExamCategory,
  NotificationType,
} from '@prisma/client';
import { NotificationsQueueService } from '../notifications/notifications-queue.service';
import { AutoValidator } from '../common/base/validation-guide';
import {
  CalendarEventWhere,
  CalendarEventAttachment,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  CalendarEventWithTimeRemaining,
} from './dto/calendar.types';

// Heuristic #1: Visibility of System Status — clear error messages for calendar operations
// Heuristic #5: Error Prevention — validate event ownership before modification
// Heuristic #6: Recognition Rather Than Recall — provide clear event categorization

@Injectable()
export class CalendarService {
  constructor(
    private prisma: PrismaService,
    private notificationsQueueService: NotificationsQueueService,
  ) {}

  private async buildAccessWhere(
    userId: string,
    userRole: Role,
  ): Promise<CalendarEventWhere> {
    if (userRole === Role.MAHASISWA) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId },
        select: { courseId: true },
      });
      const courseIds = enrollments.map((e) => e.courseId);
      return {
        isPublished: true,
        OR: [
          { courseId: { in: courseIds } },
          { targetAudience: EventTargetAudience.ALL_STUDENTS },
          { userId },
        ],
      };
    }

    if (userRole === Role.DOSEN) {
      const coursesTaught = await this.prisma.course.findMany({
        where: { instructorId: userId },
        select: { id: true },
      });
      const courseIds = coursesTaught.map((c) => c.id);
      return {
        OR: [{ courseId: { in: courseIds } }, { userId }],
      };
    }

    return {};
  }

  /**
   * Get all calendar events for a user based on role
   * Admin: sees all events including unpublished
   * Lecturer: sees events from their courses including unpublished
   * Student: sees only published events from enrolled courses
   */
  async getUserEvents(
    userId: string,
    userRole: Role,
    filters?: {
      courseId?: string;
      category?: EventCategory;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: CalendarEventWhere = await this.buildAccessWhere(
      userId,
      userRole,
    );

    if (filters?.courseId) {
      where.courseId = filters.courseId;
    }
    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.startDate && filters?.endDate) {
      where.startDate = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    const events = await this.prisma.calendarEvent.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return {
      success: true,
      data: events,
      message: 'Calendar events retrieved successfully',
    };
  }

  /**
   * Get events for a specific month
   */
  async getEventsByMonth(
    userId: string,
    userRole: Role,
    year: number,
    month: number,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const accessWhere = await this.buildAccessWhere(userId, userRole);
    const where: CalendarEventWhere = {
      ...accessWhere,
      startDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    const events = await this.prisma.calendarEvent.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return {
      success: true,
      data: events,
      message: 'Monthly calendar events retrieved successfully',
    };
  }

  /**
   * Create a new calendar event
   * Admin and Lecturer can create course events
   * All users can create personal notes
   * ✅ MENGGUNAKAN AutoValidator untuk otomatis format handling
   */
  async createEvent(
    userId: string,
    userRole: Role,
    data: {
      title: string;
      description?: string;
      startDate: Date;
      endDate?: Date;
      startTime?: string;
      endTime?: string;
      location?: string;
      isOnline?: boolean;
      meetingLink?: string;
      category?: EventCategory;
      color?: string;
      type?: CalendarEventType;
      targetAudience?: EventTargetAudience;
      relatedActivityType?: RelatedActivityType;
      relatedActivityId?: string;
      isPublished?: boolean;
      attachments?: CalendarEventAttachment[];
      courseId?: string;
    },
  ) {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(data, {
      title: { type: 'string', required: true, maxLength: 200 },
      description: { type: 'string', required: false, maxLength: 2000 },
      startDate: { type: 'date', required: true },
      endDate: { type: 'date', required: false },
      startTime: { type: 'string', required: false, maxLength: 10 },
      endTime: { type: 'string', required: false, maxLength: 10 },
      location: { type: 'string', required: false, maxLength: 200 },
      isOnline: { type: 'boolean', required: false },
      meetingLink: { type: 'string', required: false, maxLength: 500 },
      courseId: { type: 'uuid', required: false },
      relatedActivityId: { type: 'uuid', required: false },
      isPublished: { type: 'boolean', required: false },
      category: {
        type: 'enum',
        required: false,
        enumValues: Object.values(EventCategory),
      },
      type: {
        type: 'enum',
        required: false,
        enumValues: Object.values(CalendarEventType),
      },
      targetAudience: {
        type: 'enum',
        required: false,
        enumValues: Object.values(EventTargetAudience),
      },
      relatedActivityType: {
        type: 'enum',
        required: false,
        enumValues: Object.values(RelatedActivityType),
      },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // If courseId is provided, verify user has permission
    if (result.sanitized.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: result.sanitized.courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Only instructor or admin can create course events
      if (userRole !== Role.ADMIN && course.instructorId !== userId) {
        throw new ForbiddenException(
          'Only course instructor can create course events',
        );
      }
    }

    // ✅ Create dengan data yang sudah divalidasi
    const event = await this.prisma.calendarEvent.create({
      data: {
        title: result.sanitized.title,
        description: result.sanitized.description,
        startDate: result.sanitized.startDate,
        endDate: data.endDate,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        isOnline: data.isOnline || false,
        meetingLink: data.meetingLink,
        category:
          result.sanitized.category || EventCategory.PENGUMUMAN_AKADEMIK,
        color: data.color || '#1a365d',
        type: result.sanitized.type || CalendarEventType.ANNOUNCEMENT,
        targetAudience:
          result.sanitized.targetAudience ||
          (result.sanitized.courseId ? EventTargetAudience.COURSE_STUDENTS : EventTargetAudience.ALL_STUDENTS),
        relatedActivityType:
          result.sanitized.relatedActivityType || RelatedActivityType.NONE,
        relatedActivityId: result.sanitized.relatedActivityId,
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        attachments: data.attachments as any,
        userId: result.sanitized.courseId ? null : userId, // Personal notes have userId, course events don't
        courseId: result.sanitized.courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
          },
        },
      },
    });

    // Send notifications to enrolled students if published and course event
    if (event.isPublished && event.courseId) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId: event.courseId },
        select: { userId: true },
      });

      const studentIds = enrollments.map((e) => e.userId);
      await this.notificationsQueueService.addBulkNotificationJob({
        userIds: studentIds,
        type: NotificationType.EVENT_CREATED,
        title: 'Event Baru Ditambahkan',
        message: `Event "${event.title}" telah dijadwalkan pada ${event.startDate.toLocaleDateString('id-ID')}`,
        link: `/calendar`,
      });
    }

    return {
      success: true,
      data: event,
      message: 'Calendar event created successfully',
    };
  }

  /**
   * Update a calendar event
   * Only event creator (for personal notes) or course instructor (for course events) can update
   */
  async updateEvent(
    userId: string,
    userRole: Role,
    eventId: string,
    data: {
      title?: string;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      startTime?: string;
      endTime?: string;
      location?: string;
      isOnline?: boolean;
      meetingLink?: string;
      category?: EventCategory;
      color?: string;
      type?: CalendarEventType;
      targetAudience?: EventTargetAudience;
      relatedActivityType?: RelatedActivityType;
      relatedActivityId?: string;
      isPublished?: boolean;
      attachments?: CalendarEventAttachment[];
    },
  ) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: { course: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check permission
    if (event.userId) {
      // Personal note - only owner can update
      if (event.userId !== userId) {
        throw new ForbiddenException(
          'You can only update your own personal notes',
        );
      }
    } else if (event.courseId) {
      // Course event - only instructor or admin can update
      if (userRole !== Role.ADMIN && event.course?.instructorId !== userId) {
        throw new ForbiddenException(
          'Only course instructor can update course events',
        );
      }
    } else {
      // Global announcement - only admin can update
      if (userRole !== Role.ADMIN) {
        throw new ForbiddenException(
          'Only admin can update global announcements',
        );
      }
    }

    // Filter out empty strings for optional UUID fields
    const relatedActivityId =
      data.relatedActivityId !== undefined
        ? data.relatedActivityId && data.relatedActivityId.trim() !== ''
          ? data.relatedActivityId
          : null
        : undefined;

    const updatedEvent = await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...data,
        relatedActivityId,
        attachments: data.attachments as any,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
          },
        },
      },
    });

    // Send schedule change notification if date/time changed and event is published
    if (
      (data.startDate || data.startTime || data.endTime) &&
      updatedEvent.isPublished &&
      updatedEvent.courseId
    ) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId: updatedEvent.courseId },
        select: { userId: true },
      });

      const studentIds = enrollments.map((e) => e.userId);
      await this.notificationsQueueService.addBulkNotificationJob({
        userIds: studentIds,
        type: NotificationType.SCHEDULE_CHANGED,
        title: 'Perubahan Jadwal Event',
        message: `Jadwal event "${updatedEvent.title}" telah diubah menjadi ${updatedEvent.startDate.toLocaleDateString('id-ID')}`,
        link: `/calendar`,
      });
    }

    return {
      success: true,
      data: updatedEvent,
      message: 'Calendar event updated successfully',
    };
  }

  /**
   * Delete a calendar event
   * Only event creator (for personal notes) or course instructor (for course events) can delete
   */
  async deleteEvent(userId: string, userRole: Role, eventId: string) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: { course: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check permission
    if (event.userId) {
      // Personal note - only owner can delete
      if (event.userId !== userId) {
        throw new ForbiddenException(
          'You can only delete your own personal notes',
        );
      }
    } else if (event.courseId) {
      // Course event - only instructor or admin can delete
      if (userRole !== Role.ADMIN && event.course?.instructorId !== userId) {
        throw new ForbiddenException(
          'Only course instructor can delete course events',
        );
      }
    } else {
      // Global announcement - only admin can delete
      if (userRole !== Role.ADMIN) {
        throw new ForbiddenException(
          'Only admin can delete global announcements',
        );
      }
    }

    await this.prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    return {
      success: true,
      data: null,
      message: 'Calendar event deleted successfully',
    };
  }

  /**
   * Get upcoming events (next 7 days)
   */
  async getUpcomingEvents(userId: string, userRole: Role, days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const accessWhere = await this.buildAccessWhere(userId, userRole);
    const where: CalendarEventWhere = {
      ...accessWhere,
      startDate: {
        gte: today,
        lte: futureDate,
      },
    };

    const events = await this.prisma.calendarEvent.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    // Calculate time remaining for each event
    const eventsWithTimeRemaining = events.map((event: any) => {
      const now = new Date();
      const eventDate = new Date(event.startDate);
      const diffMs = eventDate.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );

      let timeRemaining = '';
      if (diffDays > 0) {
        timeRemaining = `${diffDays} hari ${diffHours} jam`;
      } else if (diffHours > 0) {
        timeRemaining = `${diffHours} jam`;
      } else {
        timeRemaining = 'Kurang dari 1 jam';
      }

      return {
        ...event,
        timeRemaining,
      };
    });

    return {
      success: true,
      data: eventsWithTimeRemaining,
      message: 'Upcoming events retrieved successfully',
    };
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string, userId: string, userRole: Role) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
            instructor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check access permissions
    if (!event.isPublished && userRole !== Role.ADMIN) {
      throw new ForbiddenException('This event is not published yet');
    }

    if (event.courseId) {
      const hasAccess =
        userRole === Role.ADMIN ||
        event.course?.instructor?.id === userId ||
        (await this.prisma.enrollment.findFirst({
          where: { userId, courseId: event.courseId },
        }));

      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this event');
      }
    }

    return {
      success: true,
      data: event,
      message: 'Event retrieved successfully',
    };
  }

  /**
   * Automatically create calendar event from assignment
   */
  async createEventFromAssignment(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if event already exists
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: {
        relatedActivityType: RelatedActivityType.ASSIGNMENT,
        relatedActivityId: assignmentId,
      },
    });

    if (existingEvent) {
      // Update existing event
      return this.prisma.calendarEvent.update({
        where: { id: existingEvent.id },
        data: {
          title: `Assignment Due: ${assignment.title}`,
          description: assignment.description,
          startDate: assignment.deadline,
          category: EventCategory.ASSIGNMENT,
          color: '#f4a261',
          courseId: assignment.courseId,
        },
      });
    }

    // Create new event
    const event = await this.prisma.calendarEvent.create({
      data: {
        title: `Assignment Due: ${assignment.title}`,
        description: assignment.description,
        startDate: assignment.deadline,
        category: EventCategory.ASSIGNMENT,
        color: '#f4a261',
        type: CalendarEventType.DEADLINE,
        targetAudience: EventTargetAudience.COURSE_STUDENTS,
        relatedActivityType: RelatedActivityType.ASSIGNMENT,
        relatedActivityId: assignmentId,
        isPublished: true,
        courseId: assignment.courseId,
      },
    });

    return event;
  }

  /**
   * Automatically create calendar event from exam
   */
  async createEventFromExam(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { course: true },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Determine category based on exam category
    let category: EventCategory = EventCategory.QUIZ;
    if (exam.category === ExamCategory.UTS) category = EventCategory.UTS;
    if (exam.category === ExamCategory.UAS) category = EventCategory.UAS;

    // Check if event already exists
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: {
        relatedActivityType: RelatedActivityType.EXAM,
        relatedActivityId: examId,
      },
    });

    if (existingEvent) {
      // Update existing event
      return this.prisma.calendarEvent.update({
        where: { id: existingEvent.id },
        data: {
          title: exam.title,
          description: exam.description,
          startDate: exam.startTime,
          endDate: exam.deadline,
          startTime: exam.startTime.toTimeString().slice(0, 5),
          endTime: exam.deadline.toTimeString().slice(0, 5),
          category,
          color:
            category === EventCategory.UTS
              ? '#e07a5f'
              : category === EventCategory.UAS
                ? '#c1121f'
                : '#2d6a4f',
          courseId: exam.courseId,
        },
      });
    }

    // Create new event
    const event = await this.prisma.calendarEvent.create({
      data: {
        title: exam.title,
        description: exam.description,
        startDate: exam.startTime,
        endDate: exam.deadline,
        startTime: exam.startTime.toTimeString().slice(0, 5),
        endTime: exam.deadline.toTimeString().slice(0, 5),
        category,
        color:
          category === EventCategory.UTS
            ? '#e07a5f'
            : category === EventCategory.UAS
              ? '#c1121f'
              : '#2d6a4f',
        type: CalendarEventType.DEADLINE,
        targetAudience: EventTargetAudience.COURSE_STUDENTS,
        relatedActivityType: RelatedActivityType.EXAM,
        relatedActivityId: examId,
        isPublished: exam.isPublished,
        courseId: exam.courseId,
      },
    });

    return event;
  }

  /**
   * Automatically create calendar event from module
   */
  async createEventFromModule(moduleId: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Check if event already exists
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: {
        relatedActivityType: RelatedActivityType.MODULE,
        relatedActivityId: moduleId,
      },
    });

    if (existingEvent) {
      // Update existing event
      return this.prisma.calendarEvent.update({
        where: { id: existingEvent.id },
        data: {
          title: `Materi Baru: ${module.title}`,
          description: module.description,
          startDate: module.updatedAt,
          category: EventCategory.MATERI_BARU,
          color: '#1a365d',
          courseId: module.courseId,
        },
      });
    }

    // Create new event
    const event = await this.prisma.calendarEvent.create({
      data: {
        title: `Materi Baru: ${module.title}`,
        description: module.description,
        startDate: module.updatedAt,
        category: EventCategory.MATERI_BARU,
        color: '#1a365d',
        type: CalendarEventType.ANNOUNCEMENT,
        targetAudience: EventTargetAudience.COURSE_STUDENTS,
        relatedActivityType: RelatedActivityType.MODULE,
        relatedActivityId: moduleId,
        isPublished: true,
        courseId: module.courseId,
      },
    });

    return event;
  }

  /**
   * Automatically create or update calendar event from week activity
   */
  async createEventFromActivity(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { week: { include: { course: true } } },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const metadata = activity.metadata as Record<string, unknown> | null;
    const courseId = activity.week.courseId;

    const categoryMap: Partial<Record<ActivityType, EventCategory>> = {
      MATERIAL: EventCategory.MATERI_BARU,
      ASSIGNMENT: EventCategory.ASSIGNMENT,
      QUIZ: EventCategory.QUIZ,
      FORUM: EventCategory.PENGUMUMAN_AKADEMIK,
      VIDEO: EventCategory.MATERI_BARU,
      EXTERNAL_LINK: EventCategory.MATERI_BARU,
    };

    const colorMap: Partial<Record<ActivityType, string>> = {
      MATERIAL: '#2d6a4f',
      ASSIGNMENT: '#f4a261',
      QUIZ: '#e07a5f',
      FORUM: '#1a365d',
      VIDEO: '#2d6a4f',
      EXTERNAL_LINK: '#457b9d',
    };

    let startDate: Date;
    if (metadata?.deadline) {
      startDate = new Date(metadata.deadline as string);
    } else if (metadata?.startTime) {
      startDate = new Date(metadata.startTime as string);
    } else if (activity.publishedAt) {
      startDate = activity.publishedAt;
    } else {
      startDate = activity.createdAt;
    }

    let title = activity.title;
    if (activity.type === ActivityType.ASSIGNMENT) {
      title = `Assignment Due: ${activity.title}`;
    } else if (activity.type === ActivityType.QUIZ) {
      title = `Quiz: ${activity.title}`;
    } else if (activity.type === ActivityType.MATERIAL) {
      title = `Materi Baru: ${activity.title}`;
    }

    const category =
      categoryMap[activity.type] || EventCategory.PENGUMUMAN_AKADEMIK;
    const color = colorMap[activity.type] || '#1a365d';
    const type =
      activity.type === ActivityType.ASSIGNMENT
        ? CalendarEventType.DEADLINE
        : CalendarEventType.ANNOUNCEMENT;

    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: {
        relatedActivityType: RelatedActivityType.ACTIVITY,
        relatedActivityId: activityId,
      },
    });

    const eventData = {
      title,
      description: activity.description,
      startDate,
      category,
      color,
      type,
      targetAudience: EventTargetAudience.COURSE_STUDENTS,
      relatedActivityType: RelatedActivityType.ACTIVITY,
      relatedActivityId: activityId,
      isPublished: activity.status === ActivityStatus.PUBLISHED,
      courseId,
    };

    if (existingEvent) {
      return this.prisma.calendarEvent.update({
        where: { id: existingEvent.id },
        data: eventData,
      });
    }

    return this.prisma.calendarEvent.create({ data: eventData });
  }

  /**
   * Remove calendar event linked to a week activity
   */
  async deleteEventFromActivity(activityId: string) {
    await this.prisma.calendarEvent.deleteMany({
      where: {
        relatedActivityType: RelatedActivityType.ACTIVITY,
        relatedActivityId: activityId,
      },
    });
  }

  /**
   * Publish/Unpublish event
   */
  async toggleEventPublish(userId: string, userRole: Role, eventId: string) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: { course: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check permission
    if (event.courseId) {
      if (userRole !== Role.ADMIN && event.course?.instructorId !== userId) {
        throw new ForbiddenException(
          'Only course instructor can publish course events',
        );
      }
    } else {
      if (userRole !== Role.ADMIN) {
        throw new ForbiddenException('Only admin can publish global events');
      }
    }

    const updatedEvent = await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: { isPublished: !event.isPublished },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedEvent,
      message: `Event ${updatedEvent.isPublished ? 'published' : 'unpublished'} successfully`,
    };
  }
}
