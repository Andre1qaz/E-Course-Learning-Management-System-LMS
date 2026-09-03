import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, NotificationType } from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { AutoValidator } from '../common/base/validation-guide';
import { RealtimeGateway } from '../websocket/websocket.gateway';

// Heuristic #1: Visibility of System Status — clear error messages for forum operations
// Heuristic #5: Error Prevention — validate thread ownership before modification
// Heuristic #18: Collaborative Learning — support threaded discussions with clear hierarchy

@Injectable()
export class ForumService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  private async verifyCourseForumAccess(
    courseId: string,
    userId: string,
    userRole?: Role,
  ) {
    if (userRole === Role.ADMIN) {
      return;
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!enrollment && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this course forum',
      );
    }
  }

  /**
   * Parse mentions from content (@username format)
   */
  private parseMentions(content: string): string[] {
    // Updated regex to support dots, hyphens, and special characters in usernames
    const mentionRegex = /@([\w.-]+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  /**
   * Find user IDs by usernames for mentions
   */
  private async findUserIdsByUsernames(
    usernames: string[],
    courseId: string,
  ): Promise<string[]> {
    // Get enrolled users in the course to match usernames against their email local parts
    const enrolledUsers = await this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    // Also include the course instructor
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    const instructor = course
      ? await this.prisma.user.findUnique({
          where: { id: course.instructorId },
          select: { id: true, email: true },
        })
      : null;

    // Combine enrolled users and instructor
    const allUsers = [
      ...enrolledUsers.map((e) => e.user),
      ...(instructor ? [instructor] : []),
    ];

    // Extract local part from email (before @) and match against mentioned usernames
    const matchedUserIds = allUsers
      .filter((user) => {
        const emailLocalPart = user.email.split('@')[0];
        return usernames.includes(emailLocalPart);
      })
      .map((user) => user.id);

    return matchedUserIds;
  }

  /**
   * Create notification for forum activity
   */
  private async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ) {
    await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      },
    });
  }

  /**
   * Process mentions and create notifications
   */
  private async processMentions(
    content: string,
    courseId: string,
    authorId: string,
    threadId?: string,
    replyId?: string,
  ) {
    const usernames = this.parseMentions(content);
    if (usernames.length === 0) return;

    const mentionedUserIds = await this.findUserIdsByUsernames(
      usernames,
      courseId,
    );

    for (const mentionedUserId of mentionedUserIds) {
      // Create mention record
      if (threadId) {
        await this.prisma.forumMention.create({
          data: {
            threadId,
            mentionedUserId,
            mentionedBy: authorId,
          },
        });
      } else if (replyId) {
        await this.prisma.forumMention.create({
          data: {
            replyId,
            mentionedUserId,
            mentionedBy: authorId,
          },
        });
      }

      // Create notification
      const author = await this.prisma.user.findUnique({
        where: { id: authorId },
        select: { name: true },
      });

      await this.createNotification(
        mentionedUserId,
        NotificationType.FORUM_REPLY,
        'You were mentioned in a forum discussion',
        `${author?.name} mentioned you in a discussion`,
        threadId
          ? `/forum/thread/${threadId}`
          : `/forum/thread/${threadId}#reply-${replyId}`,
      );
    }
  }

  /**
   * Get all forum threads for a course
   */
  async getCourseThreads(courseId: string, userId: string, userRole?: Role) {
    await this.verifyCourseForumAccess(courseId, userId, userRole);
    const threads = await this.prisma.forumThread.findMany({
      where: { courseId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
        bestReply: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { isLocked: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Mark threads with unread replies for the current user
    const threadsWithUnread = threads.map((thread: any) => {
      if (!userId) return { ...thread, unreadCount: 0 };

      const userReplies = thread.replies.filter(
        (r: any) => r.authorId === userId,
      );
      const lastUserReply =
        userReplies.length > 0 ? userReplies[userReplies.length - 1] : null;

      let unreadCount = 0;
      if (lastUserReply) {
        // Count replies after user's last reply
        unreadCount = thread.replies.filter(
          (r: any) =>
            new Date(r.createdAt) > new Date(lastUserReply.createdAt) &&
            r.authorId !== userId,
        ).length;
      } else {
        // If user hasn't replied, count replies created after thread creation as unread
        // This assumes the user saw the thread when it was created (reasonable heuristic)
        // A proper solution would require a thread read tracking table
        unreadCount = thread.replies.filter(
          (r: any) =>
            new Date(r.createdAt) > new Date(thread.createdAt) &&
            r.authorId !== userId,
        ).length;
      }

      return { ...thread, unreadCount };
    });

    return {
      success: true,
      data: threadsWithUnread,
      message: 'Forum threads retrieved successfully',
    };
  }

  /**
   * Get a single forum thread with replies
   */
  async getThread(threadId: string, userId: string, userRole?: Role) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
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
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            attachments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
        bestReply: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        locker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    await this.verifyCourseForumAccess(thread.courseId, userId, userRole);

    return {
      success: true,
      data: thread,
      message: 'Thread retrieved successfully',
    };
  }

  /**
   * Create a new forum thread
   * ✅ MENGGUNAKAN AutoValidator untuk otomatis format handling
   */
  async createThread(
    userId: string,
    courseId: string,
    data: {
      title: string;
      content: string;
      attachments?: Array<{
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
      }>;
    },
  ) {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(data, {
      title: { type: 'string', required: true, maxLength: 200 },
      content: { type: 'string', required: true, maxLength: 10000 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate dan normalize courseId
    const validatedCourseId = AutoValidator.validateUUID(courseId, 'Course ID');

    // First check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: validatedCourseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Verify user is enrolled in the course or is the instructor
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: validatedCourseId,
        },
      },
    });

    if (!enrollment && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You must be enrolled in this course to create a thread',
      );
    }

    // ✅ Create dengan data yang sudah divalidasi
    const thread = await this.prisma.forumThread.create({
      data: {
        courseId: validatedCourseId,
        authorId: userId,
        title: result.sanitized.title,
        content: result.sanitized.content,
        attachments: data.attachments
          ? {
              create: data.attachments.map((att) => ({
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileSize: BigInt(att.fileSize),
                mimeType: att.mimeType,
              })),
            }
          : undefined,
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
          },
        },
        attachments: true,
      },
    });

    // Process mentions
    await this.processMentions(data.content, courseId, userId, thread.id);

    // Notify enrolled students about new thread
    const enrolledStudents = await this.prisma.enrollment.findMany({
      where: { courseId, userId: { not: userId } },
      select: { userId: true },
    });

    for (const student of enrolledStudents) {
      await this.createNotification(
        student.userId,
        NotificationType.FORUM_REPLY,
        'New forum discussion',
        `${data.title} - ${data.content.substring(0, 100)}...`,
        `/forum/thread/${thread.id}`,
      );
    }

    // Send real-time new thread update via WebSocket
    this.realtimeGateway.sendNewThread(courseId, thread);

    return {
      success: true,
      data: thread,
      message: 'Thread created successfully',
    };
  }

  /**
   * Update a forum thread
   * Only thread author can update
   */
  async updateThread(
    userId: string,
    threadId: string,
    data: {
      title?: string;
      content?: string;
    },
  ) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.authorId !== userId) {
      throw new ForbiddenException('You can only update your own threads');
    }

    const updatedThread = await this.prisma.forumThread.update({
      where: { id: threadId },
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
          },
        },
      },
    });

    return {
      success: true,
      data: updatedThread,
      message: 'Thread updated successfully',
    };
  }

  /**
   * Delete a forum thread
   * Only thread author or course instructor can delete
   */
  async deleteThread(userId: string, userRole: string, threadId: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: { course: true },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Check permission
    if (
      thread.authorId !== userId &&
      thread.course.instructorId !== userId &&
      userRole !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'You can only delete your own threads or course instructor/admin can delete any thread',
      );
    }

    await this.prisma.forumThread.delete({
      where: { id: threadId },
    });

    return {
      success: true,
      data: null,
      message: 'Thread deleted successfully',
    };
  }

  /**
   * Pin/unpin a thread (instructor only)
   */
  async togglePinThread(userId: string, userRole: string, threadId: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: { course: true },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.course.instructorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Only course instructor can pin threads');
    }

    const updatedThread = await this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isPinned: !thread.isPinned },
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
          },
        },
      },
    });

    return {
      success: true,
      data: updatedThread,
      message: `Thread ${updatedThread.isPinned ? 'pinned' : 'unpinned'} successfully`,
    };
  }

  /**
   * Update a reply
   * Only reply author can update
   */
  async updateReply(userId: string, replyId: string, content: string) {
    const reply = await this.prisma.forumReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    if (reply.authorId !== userId) {
      throw new ForbiddenException('You can only update your own replies');
    }

    const updatedReply = await this.prisma.forumReply.update({
      where: { id: replyId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedReply,
      message: 'Reply updated successfully',
    };
  }

  /**
   * Delete a reply
   * Only reply author or course instructor can delete
   */
  async deleteReply(userId: string, userRole: string, replyId: string) {
    const reply = await this.prisma.forumReply.findUnique({
      where: { id: replyId },
      include: {
        thread: {
          include: { course: true },
        },
      },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    // Check permission
    if (
      reply.authorId !== userId &&
      reply.thread.course.instructorId !== userId &&
      userRole !== 'ADMIN'
    ) {
      throw new ForbiddenException('You can only delete your own replies');
    }

    await this.prisma.forumReply.delete({
      where: { id: replyId },
    });

    return {
      success: true,
      data: null,
      message: 'Reply deleted successfully',
    };
  }

  /**
   * Lock/unlock a thread (instructor/admin only)
   */
  async toggleLockThread(userId: string, userRole: string, threadId: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: { course: true },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.course.instructorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Only course instructor or admin can lock threads',
      );
    }

    const updatedThread = await this.prisma.forumThread.update({
      where: { id: threadId },
      data: {
        isLocked: !thread.isLocked,
        lockedAt: thread.isLocked ? null : new Date(),
        lockedBy: thread.isLocked ? null : userId,
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
          },
        },
        locker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedThread,
      message: `Thread ${updatedThread.isLocked ? 'locked' : 'unlocked'} successfully`,
    };
  }

  /**
   * Mark a reply as the best answer (instructor/admin only)
   */
  async markBestAnswer(
    userId: string,
    userRole: string,
    threadId: string,
    replyId: string,
  ) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: { course: true },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (
      thread.course.instructorId !== userId &&
      userRole !== 'ADMIN' &&
      thread.authorId !== userId
    ) {
      throw new ForbiddenException(
        'Only course instructor, admin, or thread author can mark best answers',
      );
    }

    const reply = await this.prisma.forumReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    if (reply.threadId !== threadId) {
      throw new BadRequestException('Reply does not belong to this thread');
    }

    const updatedThread = await this.prisma.forumThread.update({
      where: { id: threadId },
      data: { bestReplyId: replyId },
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
          },
        },
        bestReply: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Notify the reply author
    await this.createNotification(
      reply.authorId,
      NotificationType.FORUM_REPLY,
      'Your answer was marked as best',
      'Your reply was marked as the best answer in a forum discussion',
      `/forum/thread/${threadId}`,
    );

    return {
      success: true,
      data: updatedThread,
      message: 'Best answer marked successfully',
    };
  }

  /**
   * Remove best answer (instructor/admin only)
   */
  async removeBestAnswer(userId: string, userRole: string, threadId: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: { course: true },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (
      thread.course.instructorId !== userId &&
      userRole !== 'ADMIN' &&
      thread.authorId !== userId
    ) {
      throw new ForbiddenException(
        'Only course instructor, admin, or thread author can remove best answers',
      );
    }

    const updatedThread = await this.prisma.forumThread.update({
      where: { id: threadId },
      data: { bestReplyId: null },
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
          },
        },
      },
    });

    return {
      success: true,
      data: updatedThread,
      message: 'Best answer removed successfully',
    };
  }

  /**
   * Generate upload URL for forum attachment
   */
  async generateAttachmentUploadUrl(
    userId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
  ) {
    const { uploadUrl, fileUrl } = await this.storageService.generateUploadUrl(
      fileName,
      fileType,
      fileSize,
      false, // public bucket
    );

    return {
      success: true,
      data: { uploadUrl, fileUrl },
      message: 'Upload URL generated successfully',
    };
  }

  /**
   * Add a reply to a thread with attachments
   * ✅ MENGGUNAKAN AutoValidator untuk otomatis format handling
   */
  async createReply(
    userId: string,
    threadId: string,
    data: {
      content: string;
      attachments?: Array<{
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
      }>;
    },
  ) {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(data, {
      content: { type: 'string', required: true, maxLength: 10000 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate dan normalize threadId
    const validatedThreadId = AutoValidator.validateUUID(threadId, 'Thread ID');

    const thread = await this.prisma.forumThread.findUnique({
      where: { id: validatedThreadId },
      include: { course: true },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Check if thread is locked
    if (thread.isLocked) {
      throw new ForbiddenException(
        'This thread is locked and no longer accepts new replies',
      );
    }

    // Verify user is enrolled in the course or is the instructor
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: thread.courseId,
        },
      },
    });

    if (!enrollment && thread.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You must be enrolled in this course to reply',
      );
    }

    const reply = await this.prisma.forumReply.create({
      data: {
        threadId,
        authorId: userId,
        content: data.content,
        attachments: data.attachments
          ? {
              create: data.attachments.map((att) => ({
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileSize: BigInt(att.fileSize),
                mimeType: att.mimeType,
              })),
            }
          : undefined,
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
        attachments: true,
      },
    });

    // Process mentions
    await this.processMentions(
      data.content,
      thread.courseId,
      userId,
      undefined,
      reply.id,
    );

    // Notify thread author about new reply
    if (thread.authorId !== userId) {
      await this.createNotification(
        thread.authorId,
        NotificationType.FORUM_REPLY,
        'New reply to your discussion',
        `${data.content.substring(0, 100)}...`,
        `/forum/thread/${threadId}`,
      );
    }

    // Send real-time forum reply update via WebSocket
    this.realtimeGateway.sendForumReply(threadId, reply);

    return {
      success: true,
      data: reply,
      message: 'Reply created successfully',
    };
  }
}
