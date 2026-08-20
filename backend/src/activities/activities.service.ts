import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { Role, ActivityStatus, ActivityType } from '@prisma/client';
import { CalendarService } from '../calendar/calendar.service';
import { NotificationsQueueService } from '../notifications/notifications-queue.service';
import { AutoValidator } from '../common/base/validation-guide';

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    private calendarService: CalendarService,
    private notificationsQueueService: NotificationsQueueService,
  ) {}

  async findByWeek(weekId: string, userId: string, userRole: Role) {
    // Check if user has access to the week's course
    const week = await this.prisma.week.findUnique({
      where: { id: weekId },
      include: { course: true },
    });

    if (!week) {
      throw new NotFoundException('Week not found');
    }

    await this.checkCourseAccess(week.courseId, userId, userRole);

    // Students only see published activities
    const whereClause =
      userRole === Role.MAHASISWA
        ? { weekId, status: ActivityStatus.PUBLISHED }
        : { weekId };

    return this.prisma.activity.findMany({
      where: whereClause,
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: { week: { include: { course: true } } },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Check if user has access to the course
    await this.checkCourseAccess(activity.week.courseId, userId, userRole);

    // Students cannot see draft activities
    if (
      userRole === Role.MAHASISWA &&
      activity.status === ActivityStatus.DRAFT
    ) {
      throw new ForbiddenException('You do not have access to this activity');
    }

    return activity;
  }

  async create(
    weekId: string,
    dto: CreateActivityDto,
    userId: string,
    userRole: Role,
  ) {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      title: { type: 'string', required: true, maxLength: 200 },
      description: { type: 'string', required: false, maxLength: 2000 },
      type: { type: 'string', required: true },
      status: { type: 'string', required: false },
      order: { type: 'number', required: false, min: 0 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate dan normalize weekId
    const validatedWeekId = AutoValidator.validateUUID(weekId, 'Week ID');

    // Only ADMIN and DOSEN can create activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException(
        'Only Admin and Dosen can create activities',
      );
    }

    // Check if week exists and user has access
    const week = await this.prisma.week.findUnique({
      where: { id: validatedWeekId },
      include: { course: true },
    });

    if (!week) {
      throw new NotFoundException('Week not found');
    }

    await this.checkCourseAccess(week.courseId, userId, userRole);

    const activity = await this.prisma.activity.create({
      data: {
        weekId: validatedWeekId,
        type: result.sanitized.type,
        title: result.sanitized.title,
        description: result.sanitized.description,
        status: result.sanitized.status,
        order: result.sanitized.order ?? 0,
        metadata: dto.metadata ?? undefined,
        publishedAt:
          result.sanitized.status === 'PUBLISHED' ? new Date() : null,
      },
    });

    try {
      await this.calendarService.createEventFromActivity(activity.id);
    } catch {
      // Activity is already created; calendar sync must not block Add Activity.
    }

    if (result.sanitized.status === 'PUBLISHED') {
      await this.notifyActivityPublished(activity.id);
    }

    return activity;
  }

  async update(
    id: string,
    dto: UpdateActivityDto,
    userId: string,
    userRole: Role,
  ) {
    // Only ADMIN and DOSEN can update activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException(
        'Only Admin and Dosen can update activities',
      );
    }

    const activity = await this.findOne(id, userId, userRole);

    // Update publishedAt if status is being changed to PUBLISHED
    const updateData: UpdateActivityDto & { publishedAt?: string } = { ...dto };
    if (
      dto.status === 'PUBLISHED' &&
      activity.status !== ActivityStatus.PUBLISHED
    ) {
      updateData.publishedAt = new Date().toISOString();
    }

    const updatedActivity = await this.prisma.activity.update({
      where: { id },
      data: updateData,
    });

    await this.calendarService.createEventFromActivity(updatedActivity.id);

    if (
      dto.status === 'PUBLISHED' &&
      activity.status !== ActivityStatus.PUBLISHED
    ) {
      await this.notifyActivityPublished(updatedActivity.id);
    }

    return updatedActivity;
  }

  async remove(id: string, userId: string, userRole: Role) {
    // Only ADMIN and DOSEN can delete activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException(
        'Only Admin and Dosen can delete activities',
      );
    }

    await this.findOne(id, userId, userRole);
    await this.calendarService.deleteEventFromActivity(id);

    return this.prisma.activity.delete({
      where: { id },
    });
  }

  async duplicate(id: string, userId: string, userRole: Role) {
    // Only ADMIN and DOSEN can duplicate activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException(
        'Only Admin and Dosen can duplicate activities',
      );
    }

    const activity = await this.findOne(id, userId, userRole);

    const {
      id: _,
      createdAt,
      updatedAt,
      publishedAt,
      week,
      metadata,
      ...activityData
    } = activity;

    return this.prisma.activity.create({
      data: {
        ...activityData,
        title: `${activity.title} (Copy)`,
        status: ActivityStatus.DRAFT,
        publishedAt: null,
        metadata: metadata as any,
      },
    });
  }

  async move(id: string, newWeekId: string, userId: string, userRole: Role) {
    // Only ADMIN and DOSEN can move activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can move activities');
    }

    const activity = await this.findOne(id, userId, userRole);

    // Check if new week exists and user has access
    const newWeek = await this.prisma.week.findUnique({
      where: { id: newWeekId },
      include: { course: true },
    });

    if (!newWeek) {
      throw new NotFoundException('Target week not found');
    }

    await this.checkCourseAccess(newWeek.courseId, userId, userRole);

    return this.prisma.activity.update({
      where: { id },
      data: { weekId: newWeekId },
    });
  }

  async reorder(
    weekId: string,
    activityOrders: { id: string; order: number }[],
    userId: string,
    userRole: Role,
  ) {
    // Only ADMIN and DOSEN can reorder activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException(
        'Only Admin and Dosen can reorder activities',
      );
    }

    // Check if user has access to the week
    const week = await this.prisma.week.findUnique({
      where: { id: weekId },
      include: { course: true },
    });

    if (!week) {
      throw new NotFoundException('Week not found');
    }

    await this.checkCourseAccess(week.courseId, userId, userRole);

    // Update orders in a transaction
    return this.prisma.$transaction(
      activityOrders.map(({ id, order }) =>
        this.prisma.activity.update({
          where: { id },
          data: { order },
        }),
      ),
    );
  }

  async reorderGlobal(
    activityOrders: { id: string; order: number }[],
    userId: string,
    userRole: Role,
  ) {
    // Only ADMIN and DOSEN can reorder activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException(
        'Only Admin and Dosen can reorder activities',
      );
    }

    // Verify that all activities belong to courses the user has access to
    const activityIds = activityOrders.map((a) => a.id);
    const activities = await this.prisma.activity.findMany({
      where: { id: { in: activityIds } },
      include: { week: { include: { course: true } } },
    });

    for (const activity of activities) {
      await this.checkCourseAccess(activity.week.courseId, userId, userRole);
    }

    // Update orders in a transaction
    return this.prisma.$transaction(
      activityOrders.map(({ id, order }) =>
        this.prisma.activity.update({
          where: { id },
          data: { order },
        }),
      ),
    );
  }

  async publish(id: string, userId: string, userRole: Role) {
    // Only ADMIN and DOSEN can publish activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException(
        'Only Admin and Dosen can publish activities',
      );
    }

    const activity = await this.findOne(id, userId, userRole);

    if (activity.status === ActivityStatus.PUBLISHED) {
      throw new ForbiddenException('Activity is already published');
    }

    const updatedActivity = await this.prisma.activity.update({
      where: { id },
      data: {
        status: ActivityStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    await this.notifyActivityPublished(updatedActivity.id);

    return updatedActivity;
  }

  async unpublish(id: string, userId: string, userRole: Role) {
    // Only ADMIN and DOSEN can unpublish activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException(
        'Only Admin and Dosen can unpublish activities',
      );
    }

    const activity = await this.findOne(id, userId, userRole);

    if (activity.status === ActivityStatus.DRAFT) {
      throw new ForbiddenException('Activity is already a draft');
    }

    return this.prisma.activity.update({
      where: { id },
      data: {
        status: ActivityStatus.DRAFT,
        publishedAt: null,
      },
    });
  }

  private async checkCourseAccess(
    courseId: string,
    userId: string,
    userRole: Role,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Admin has access to all courses
    if (userRole === Role.ADMIN) {
      return;
    }

    // Dosen can only access their own courses
    if (userRole === Role.DOSEN) {
      if (course.instructorId !== userId) {
        throw new ForbiddenException('You do not have access to this course');
      }
      return;
    }

    // Mahasiswa can only access enrolled courses
    if (userRole === Role.MAHASISWA) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('You are not enrolled in this course');
      }
      return;
    }

    throw new ForbiddenException('You do not have access to this course');
  }

  private async notifyActivityPublished(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { week: { include: { course: true } } },
    });

    if (!activity) return;

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: activity.week.courseId },
      select: { userId: true },
    });

    const studentIds = enrollments.map((e) => e.userId);
    if (studentIds.length === 0) return;

    const typeLabels: Partial<Record<ActivityType, string>> = {
      ASSIGNMENT: 'Tugas',
      QUIZ: 'Quiz',
      MATERIAL: 'Materi',
      FORUM: 'Forum',
      VIDEO: 'Video',
      EXTERNAL_LINK: 'Link Eksternal',
    };

    const notificationTypeMap: Partial<
      Record<
        ActivityType,
        'ASSIGNMENT_CREATED' | 'QUIZ_CREATED' | 'MATERIAL_PUBLISHED'
      >
    > = {
      ASSIGNMENT: 'ASSIGNMENT_CREATED',
      QUIZ: 'QUIZ_CREATED',
      MATERIAL: 'MATERIAL_PUBLISHED',
      VIDEO: 'MATERIAL_PUBLISHED',
      EXTERNAL_LINK: 'MATERIAL_PUBLISHED',
    };

    const metadata = activity.metadata as Record<string, unknown> | null;
    const dateInfo = metadata?.deadline
      ? ` Deadline: ${new Date(metadata.deadline as string).toLocaleDateString('id-ID')}`
      : '';

    await this.notificationsQueueService.addBulkNotificationJob({
      userIds: studentIds,
      type: notificationTypeMap[activity.type] || 'MATERIAL_PUBLISHED',
      title: `${typeLabels[activity.type] || 'Aktivitas'} Baru Dipublikasikan`,
      message: `"${activity.title}" di course "${activity.week.course.name}" telah dipublikasikan.${dateInfo}`,
      link: `/mahasiswa/courses/${activity.week.courseId}`,
    });
  }
}
