import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

// Heuristic #1: Visibility of System Status — clear notification creation and retrieval
// Heuristic #20: Feedback and Assessment — automatic notifications for grades
// Heuristic #18: Collaborative Learning — notifications for forum replies

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId: string, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 notifications
    });

    return {
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully',
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      success: true,
      data: { count },
      message: 'Unread count retrieved successfully',
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only mark your own notifications as read');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return {
      success: true,
      data: null,
      message: 'Notification marked as read',
    };
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return {
      success: true,
      data: null,
      message: 'All notifications marked as read',
    };
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only delete your own notifications');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return {
      success: true,
      data: null,
      message: 'Notification deleted successfully',
    };
  }

  /**
   * Create a notification (internal method for job queue)
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data,
    });

    return notification;
  }

  /**
   * Create notification for multiple users (bulk)
   */
  async createBulkNotifications(data: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    const notifications = await this.prisma.notification.createMany({
      data: data.userIds.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
      })),
    });

    return notifications;
  }

  /**
   * Create deadline reminder notification
   */
  async createDeadlineReminder(userId: string, assignmentTitle: string, courseName: string, deadlineDate: Date) {
    return this.createNotification({
      userId,
      type: NotificationType.DEADLINE_REMINDER,
      title: 'Reminder Deadline Tugas',
      message: `Tugas "${assignmentTitle}" di course "${courseName}" akan berakhir pada ${deadlineDate.toLocaleDateString('id-ID')}`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create exam reminder notification
   */
  async createExamReminder(userId: string, examTitle: string, courseName: string, examDate: Date) {
    return this.createNotification({
      userId,
      type: NotificationType.EXAM_REMINDER,
      title: 'Reminder Ujian',
      message: `Ujian "${examTitle}" di course "${courseName}" akan dimulai pada ${examDate.toLocaleDateString('id-ID')}`,
      link: '/mahasiswa/exams',
    });
  }

  /**
   * Create grade released notification
   */
  async createGradeReleased(userId: string, itemType: string, itemName: string, courseName: string) {
    return this.createNotification({
      userId,
      type: NotificationType.GRADE_RELEASED,
      title: 'Nilai Telah Keluar',
      message: `Nilai ${itemType} "${itemName}" di course "${courseName}" telah keluar`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create forum reply notification
   */
  async createForumReplyNotification(userId: string, threadTitle: string, replierName: string) {
    return this.createNotification({
      userId,
      type: NotificationType.FORUM_REPLY,
      title: 'Balasan Baru di Forum',
      message: `${replierName} membalas diskusi "${threadTitle}"`,
      link: '/mahasiswa/forum',
    });
  }

  /**
   * Create course created notification
   */
  async createCourseCreatedNotification(userId: string, courseName: string, courseCode: string) {
    return this.createNotification({
      userId,
      type: NotificationType.COURSE_CREATED,
      title: 'Course Baru Dibuat',
      message: `Course "${courseName}" (${courseCode}) telah dibuat`,
      link: '/admin/courses',
    });
  }

  /**
   * Create material published notification
   */
  async createMaterialPublishedNotification(userId: string, materialTitle: string, courseName: string) {
    return this.createNotification({
      userId,
      type: NotificationType.MATERIAL_PUBLISHED,
      title: 'Materi Baru Tersedia',
      message: `Materi "${materialTitle}" telah ditambahkan di course "${courseName}"`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create assignment created notification
   */
  async createAssignmentCreatedNotification(userId: string, assignmentTitle: string, courseName: string, deadline: Date) {
    return this.createNotification({
      userId,
      type: NotificationType.ASSIGNMENT_CREATED,
      title: 'Tugas Baru Ditambahkan',
      message: `Tugas "${assignmentTitle}" di course "${courseName}". Deadline: ${deadline.toLocaleDateString('id-ID')}`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create quiz created notification
   */
  async createQuizCreatedNotification(userId: string, quizTitle: string, courseName: string, startTime: Date) {
    return this.createNotification({
      userId,
      type: NotificationType.QUIZ_CREATED,
      title: 'Quiz Baru Dijadwalkan',
      message: `Quiz "${quizTitle}" di course "${courseName}" akan dimulai pada ${startTime.toLocaleDateString('id-ID')} ${startTime.toLocaleTimeString('id-ID')}`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create exam created notification
   */
  async createExamCreatedNotification(userId: string, examTitle: string, courseName: string, startTime: Date) {
    return this.createNotification({
      userId,
      type: NotificationType.EXAM_CREATED,
      title: 'Ujian Baru Dijadwalkan',
      message: `Ujian "${examTitle}" di course "${courseName}" akan dimulai pada ${startTime.toLocaleDateString('id-ID')} ${startTime.toLocaleTimeString('id-ID')}`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create event created notification
   */
  async createEventCreatedNotification(userId: string, eventTitle: string, eventDate: Date) {
    return this.createNotification({
      userId,
      type: NotificationType.EVENT_CREATED,
      title: 'Event Baru Ditambahkan',
      message: `Event "${eventTitle}" telah dijadwalkan pada ${eventDate.toLocaleDateString('id-ID')}`,
      link: '/calendar',
    });
  }

  /**
   * Create schedule changed notification
   */
  async createScheduleChangedNotification(userId: string, itemType: string, itemName: string, newDate: Date) {
    return this.createNotification({
      userId,
      type: NotificationType.SCHEDULE_CHANGED,
      title: 'Perubahan Jadwal',
      message: `Jadwal ${itemType} "${itemName}" telah diubah menjadi ${newDate.toLocaleDateString('id-ID')}`,
      link: '/calendar',
    });
  }
}
