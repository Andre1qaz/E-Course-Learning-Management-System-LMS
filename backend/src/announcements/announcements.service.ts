import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private async buildAccessWhere(userId: string, userRole: Role) {
    if (userRole === Role.MAHASISWA) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId },
        select: { courseId: true },
      });
      const courseIds = enrollments.map((e) => e.courseId);
      const now = new Date();
      return {
        isPublished: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
        AND: [
          {
            OR: [
              { courseId: { in: courseIds } },
              { courseId: null },
            ],
          },
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
        OR: [
          { courseId: { in: courseIds } },
          { courseId: null },
          { authorId: userId },
        ],
      };
    }

    return {};
  }

  async getAnnouncements(userId: string, userRole: Role, filters?: {
    courseId?: string;
    unreadOnly?: boolean;
  }) {
    const where: any = await this.buildAccessWhere(userId, userRole);

    if (filters?.courseId) {
      where.courseId = filters.courseId;
    }

    if (filters?.unreadOnly && userRole === Role.MAHASISWA) {
      const readAnnouncementIds = await (this.prisma as any).announcementRead.findMany({
        where: { userId },
        select: { announcementId: true },
      });
      const readIds = readAnnouncementIds.map((r: any) => r.announcementId);
      where.id = { notIn: readIds };
    }

    const announcements = await (this.prisma as any).announcement.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
          },
        },
        readStatus: userRole === Role.MAHASISWA ? {
          where: { userId },
          select: {
            userId: true,
            readAt: true,
          },
        } : false,
      },
      orderBy: { publishedAt: 'desc' },
    });

    const announcementsWithReadStatus = announcements.map((announcement: any) => ({
      ...announcement,
      isRead: userRole === Role.MAHASISWA ? announcement.readStatus.length > 0 : true,
      readStatus: undefined,
    }));

    return {
      success: true,
      data: announcementsWithReadStatus,
      message: 'Announcements retrieved successfully',
    };
  }

  async getAnnouncementById(id: string, userId: string, userRole: Role) {
    const announcement = await (this.prisma as any).announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
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

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (!announcement.isPublished && userRole !== Role.ADMIN && announcement.authorId !== userId) {
      throw new ForbiddenException('This announcement is not published yet');
    }

    if (announcement.courseId) {
      const hasAccess =
        userRole === Role.ADMIN ||
        announcement.authorId === userId ||
        announcement.course?.instructorId === userId ||
        (await this.prisma.enrollment.findFirst({
          where: { userId, courseId: announcement.courseId },
        }));

      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this announcement');
      }
    }

    if (userRole === Role.MAHASISWA) {
      const existingRead = await (this.prisma as any).announcementRead.findUnique({
        where: {
          announcementId_userId: {
            announcementId: id,
            userId,
          },
        },
      });

      if (!existingRead) {
        await (this.prisma as any).announcementRead.create({
          data: {
            announcementId: id,
            userId,
          },
        });
      }
    }

    return {
      success: true,
      data: announcement,
      message: 'Announcement retrieved successfully',
    };
  }

  async createAnnouncement(userId: string, userRole: Role, data: {
    title: string;
    content: string;
    attachments?: any;
    validFrom?: Date;
    validUntil?: Date;
    isPublished?: boolean;
    priority?: string;
    courseId?: string;
  }) {
    if (data.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: data.courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      if (userRole !== Role.ADMIN && course.instructorId !== userId) {
        throw new ForbiddenException('Only course instructor can create course announcements');
      }
    } else if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can create global announcements');
    }

    const announcement = await (this.prisma as any).announcement.create({
      data: {
        title: data.title,
        content: data.content,
        attachments: data.attachments,
        validFrom: data.validFrom || new Date(),
        validUntil: data.validUntil,
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        priority: data.priority || 'normal',
        courseId: data.courseId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
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

    if (announcement.isPublished) {
      let targetUserIds: string[] = [];

      if (announcement.courseId) {
        const enrollments = await this.prisma.enrollment.findMany({
          where: { courseId: announcement.courseId },
          select: { userId: true },
        });
        targetUserIds = enrollments.map((e) => e.userId);
      } else {
        const allStudents = await this.prisma.user.findMany({
          where: { role: Role.MAHASISWA },
          select: { id: true },
        });
        targetUserIds = allStudents.map((u) => u.id);
      }

      if (targetUserIds.length > 0) {
        await this.notificationsService.createBulkNotifications({
          userIds: targetUserIds,
          type: 'ANNOUNCEMENT_CREATED' as any,
          title: 'Pengumuman Baru',
          message: announcement.courseId 
            ? `Pengumuman baru: "${announcement.title}" di ${announcement.course.name}`
            : `Pengumuman baru: "${announcement.title}"`,
          link: announcement.courseId ? `/courses/${announcement.courseId}` : '/announcements',
        });
      }
    }

    return {
      success: true,
      data: announcement,
      message: 'Announcement created successfully',
    };
  }

  async updateAnnouncement(id: string, userId: string, userRole: Role, data: {
    title?: string;
    content?: string;
    attachments?: any;
    validFrom?: Date;
    validUntil?: Date;
    isPublished?: boolean;
    priority?: string;
  }) {
    const announcement = await (this.prisma as any).announcement.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (userRole !== Role.ADMIN && announcement.authorId !== userId) {
      throw new ForbiddenException('You can only update your own announcements');
    }

    const updatedAnnouncement = await (this.prisma as any).announcement.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
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
      data: updatedAnnouncement,
      message: 'Announcement updated successfully',
    };
  }

  async deleteAnnouncement(id: string, userId: string, userRole: Role) {
    const announcement = await (this.prisma as any).announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (userRole !== Role.ADMIN && announcement.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own announcements');
    }

    await (this.prisma as any).announcement.delete({
      where: { id },
    });

    return {
      success: true,
      data: null,
      message: 'Announcement deleted successfully',
    };
  }

  async getUnreadCount(userId: string) {
    const now = new Date();
    const allAnnouncements = await (this.prisma as any).announcement.findMany({
      where: {
        isPublished: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
      select: { id: true, courseId: true },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    const accessibleAnnouncements = allAnnouncements.filter(
      (a: any) => !a.courseId || enrolledCourseIds.includes(a.courseId)
    );

    const readAnnouncementIds = await (this.prisma as any).announcementRead.findMany({
      where: { userId },
      select: { announcementId: true },
    });
    const readIds = new Set(readAnnouncementIds.map((r: any) => r.announcementId));

    const unreadCount = accessibleAnnouncements.filter((a: any) => !readIds.has(a.id)).length;

    return {
      success: true,
      data: { unreadCount },
      message: 'Unread count retrieved successfully',
    };
  }

  async markAsRead(id: string, userId: string) {
    const announcement = await (this.prisma as any).announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    const existingRead = await (this.prisma as any).announcementRead.findUnique({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId,
        },
      },
    });

    if (!existingRead) {
      await (this.prisma as any).announcementRead.create({
        data: {
          announcementId: id,
          userId,
        },
      });
    }

    return {
      success: true,
      data: null,
      message: 'Announcement marked as read',
    };
  }

  async markAllAsRead(userId: string) {
    const now = new Date();
    const allAnnouncements = await (this.prisma as any).announcement.findMany({
      where: {
        isPublished: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
      select: { id: true, courseId: true },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    const accessibleAnnouncements = allAnnouncements.filter(
      (a: any) => !a.courseId || enrolledCourseIds.includes(a.courseId)
    );

    const readAnnouncementIds = await (this.prisma as any).announcementRead.findMany({
      where: { userId },
      select: { announcementId: true },
    });
    const readIds = new Set(readAnnouncementIds.map((r: any) => r.announcementId));

    const unreadAnnouncements = accessibleAnnouncements.filter((a: any) => !readIds.has(a.id));

    await (this.prisma as any).announcementRead.createMany({
      data: unreadAnnouncements.map((a: any) => ({
        announcementId: a.id,
        userId,
      })),
      skipDuplicates: true,
    });

    return {
      success: true,
      data: null,
      message: 'All announcements marked as read',
    };
  }
}
