import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { AutoValidator } from '../common/base/validation-guide';

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
    // ✅ Validate userId dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');

    const where: any = { userId: validatedUserId };
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
    // ✅ Validate userId dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');

    const count = await this.prisma.notification.count({
      where: {
        userId: validatedUserId,
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
    // ✅ Validate UUIDs dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedNotificationId = AutoValidator.validateUUID(notificationId, 'Notification ID');

    const notification = await this.prisma.notification.findUnique({
      where: { id: validatedNotificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== validatedUserId) {
      throw new ForbiddenException('You can only mark your own notifications as read');
    }

    await this.prisma.notification.update({
      where: { id: validatedNotificationId },
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
    // ✅ Validate userId dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');

    await this.prisma.notification.updateMany({
      where: {
        userId: validatedUserId,
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
    // ✅ Validate UUIDs dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedNotificationId = AutoValidator.validateUUID(notificationId, 'Notification ID');

    const notification = await this.prisma.notification.findUnique({
      where: { id: validatedNotificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== validatedUserId) {
      throw new ForbiddenException('You can only delete your own notifications');
    }

    await this.prisma.notification.delete({
      where: { id: validatedNotificationId },
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
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(data, {
      userId: { type: 'uuid', required: true },
      type: { type: 'string', required: true },
      title: { type: 'string', required: true, maxLength: 200 },
      message: { type: 'string', required: true, maxLength: 1000 },
      link: { type: 'string', required: false, maxLength: 500 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    const notification = await this.prisma.notification.create({
      data: result.sanitized,
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
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(data, {
      userIds: { type: 'auto', required: true },
      type: { type: 'string', required: true },
      title: { type: 'string', required: true, maxLength: 200 },
      message: { type: 'string', required: true, maxLength: 1000 },
      link: { type: 'string', required: false, maxLength: 500 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate semua userIds
    const validatedUserIds = result.sanitized.userIds.map((userId: string) =>
      AutoValidator.validateUUID(userId, 'User ID')
    );

    const notifications = await this.prisma.notification.createMany({
      data: validatedUserIds.map((userId: string) => ({
        userId,
        type: result.sanitized.type,
        title: result.sanitized.title,
        message: result.sanitized.message,
        link: result.sanitized.link,
      })),
    });

    return notifications;
  }

  /**
   * Create deadline reminder notification
   */
  async createDeadlineReminder(userId: string, assignmentTitle: string, courseName: string, deadlineDate: Date) {
    // ✅ Validate input dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedAssignmentTitle = AutoValidator.validateString(assignmentTitle, 'Assignment title', 200);
    const validatedCourseName = AutoValidator.validateString(courseName, 'Course name', 200);
    const validatedDeadline = AutoValidator.validateDate(deadlineDate, 'Deadline date');

    return this.createNotification({
      userId: validatedUserId,
      type: NotificationType.DEADLINE_REMINDER,
      title: 'Reminder Deadline Tugas',
      message: `Tugas "${validatedAssignmentTitle}" di course "${validatedCourseName}" akan berakhir pada ${validatedDeadline.toLocaleDateString('id-ID')}`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create exam reminder notification
   */
  async createExamReminder(userId: string, examTitle: string, courseName: string, examDate: Date) {
    // ✅ Validate input dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedExamTitle = AutoValidator.validateString(examTitle, 'Exam title', 200);
    const validatedCourseName = AutoValidator.validateString(courseName, 'Course name', 200);
    const validatedExamDate = AutoValidator.validateDate(examDate, 'Exam date');

    return this.createNotification({
      userId: validatedUserId,
      type: NotificationType.EXAM_REMINDER,
      title: 'Reminder Ujian',
      message: `Ujian "${validatedExamTitle}" di course "${validatedCourseName}" akan dimulai pada ${validatedExamDate.toLocaleDateString('id-ID')}`,
      link: '/mahasiswa/exams',
    });
  }

  /**
   * Create grade released notification
   */
  async createGradeReleased(userId: string, itemType: string, itemName: string, courseName: string) {
    // ✅ Validate input dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedItemType = AutoValidator.validateString(itemType, 'Item type', 50);
    const validatedItemName = AutoValidator.validateString(itemName, 'Item name', 200);
    const validatedCourseName = AutoValidator.validateString(courseName, 'Course name', 200);

    return this.createNotification({
      userId: validatedUserId,
      type: NotificationType.GRADE_RELEASED,
      title: 'Nilai Telah Keluar',
      message: `Nilai ${validatedItemType} "${validatedItemName}" di course "${validatedCourseName}" telah keluar`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create forum reply notification
   */
  async createForumReplyNotification(userId: string, threadTitle: string, replierName: string) {
    // ✅ Validate input dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedThreadTitle = AutoValidator.validateString(threadTitle, 'Thread title', 200);
    const validatedReplierName = AutoValidator.validateString(replierName, 'Replier name', 100);

    return this.createNotification({
      userId: validatedUserId,
      type: NotificationType.FORUM_REPLY,
      title: 'Balasan Baru di Forum',
      message: `${validatedReplierName} membalas diskusi "${validatedThreadTitle}"`,
      link: '/mahasiswa/forum',
    });
  }

  /**
   * Create course created notification
   */
  async createCourseCreatedNotification(userId: string, courseName: string, courseCode: string) {
    // ✅ Validate input dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedCourseName = AutoValidator.validateString(courseName, 'Course name', 200);
    const validatedCourseCode = AutoValidator.validateString(courseCode, 'Course code', 50);

    return this.createNotification({
      userId: validatedUserId,
      type: NotificationType.COURSE_CREATED,
      title: 'Course Baru Dibuat',
      message: `Course "${validatedCourseName}" (${validatedCourseCode}) telah dibuat`,
      link: '/admin/courses',
    });
  }

  /**
   * Create material published notification
   */
  async createMaterialPublishedNotification(userId: string, materialTitle: string, courseName: string) {
    // ✅ Validate input dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedMaterialTitle = AutoValidator.validateString(materialTitle, 'Material title', 200);
    const validatedCourseName = AutoValidator.validateString(courseName, 'Course name', 200);

    return this.createNotification({
      userId: validatedUserId,
      type: NotificationType.MATERIAL_PUBLISHED,
      title: 'Materi Baru Tersedia',
      message: `Materi "${validatedMaterialTitle}" telah ditambahkan di course "${validatedCourseName}"`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create assignment created notification
   */
  async createAssignmentCreatedNotification(userId: string, assignmentTitle: string, courseName: string, deadline: Date) {
    // ✅ Validate input dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedAssignmentTitle = AutoValidator.validateString(assignmentTitle, 'Assignment title', 200);
    const validatedCourseName = AutoValidator.validateString(courseName, 'Course name', 200);
    const validatedDeadline = AutoValidator.validateDate(deadline, 'Deadline');

    return this.createNotification({
      userId: validatedUserId,
      type: NotificationType.ASSIGNMENT_CREATED,
      title: 'Tugas Baru Ditambahkan',
      message: `Tugas "${validatedAssignmentTitle}" di course "${validatedCourseName}". Deadline: ${validatedDeadline.toLocaleDateString('id-ID')}`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create quiz created notification
   */
  async createQuizCreatedNotification(userId: string, quizTitle: string, courseName: string, startTime: Date) {
    // ✅ Validate input dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedQuizTitle = AutoValidator.validateString(quizTitle, 'Quiz title', 200);
    const validatedCourseName = AutoValidator.validateString(courseName, 'Course name', 200);
    const validatedStartTime = AutoValidator.validateDate(startTime, 'Start time');

    return this.createNotification({
      userId: validatedUserId,
      type: NotificationType.QUIZ_CREATED,
      title: 'Quiz Baru Dijadwalkan',
      message: `Quiz "${validatedQuizTitle}" di course "${validatedCourseName}" akan dimulai pada ${validatedStartTime.toLocaleDateString('id-ID')} ${validatedStartTime.toLocaleTimeString('id-ID')}`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create exam created notification
   */
  async createExamCreatedNotification(userId: string, examTitle: string, courseName: string, startTime: Date) {
    // ✅ Validate input dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedExamTitle = AutoValidator.validateString(examTitle, 'Exam title', 200);
    const validatedCourseName = AutoValidator.validateString(courseName, 'Course name', 200);
    const validatedStartTime = AutoValidator.validateDate(startTime, 'Start time');

    return this.createNotification({
      userId: validatedUserId,
      type: NotificationType.EXAM_CREATED,
      title: 'Ujian Baru Dijadwalkan',
      message: `Ujian "${validatedExamTitle}" di course "${validatedCourseName}" akan dimulai pada ${validatedStartTime.toLocaleDateString('id-ID')} ${validatedStartTime.toLocaleTimeString('id-ID')}`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create event created notification
   */
  async createEventCreatedNotification(userId: string, eventTitle: string, eventDate: Date) {
    // ✅ Validate input dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedEventTitle = AutoValidator.validateString(eventTitle, 'Event title', 200);
    const validatedEventDate = AutoValidator.validateDate(eventDate, 'Event date');

    return this.createNotification({
      userId: validatedUserId,
      type: NotificationType.EVENT_CREATED,
      title: 'Event Baru Ditambahkan',
      message: `Event "${validatedEventTitle}" telah dijadwalkan pada ${validatedEventDate.toLocaleDateString('id-ID')}`,
      link: '/calendar',
    });
  }

  /**
   * Create schedule changed notification
   */
  async createScheduleChangedNotification(userId: string, itemType: string, itemName: string, newDate: Date) {
    // ✅ Validate input dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');
    const validatedItemType = AutoValidator.validateString(itemType, 'Item type', 50);
    const validatedItemName = AutoValidator.validateString(itemName, 'Item name', 200);
    const validatedNewDate = AutoValidator.validateDate(newDate, 'New date');

    return this.createNotification({
      userId: validatedUserId,
      type: NotificationType.SCHEDULE_CHANGED,
      title: 'Perubahan Jadwal',
      message: `Jadwal ${validatedItemType} "${validatedItemName}" telah diubah menjadi ${validatedNewDate.toLocaleDateString('id-ID')}`,
      link: '/calendar',
    });
  }
}
