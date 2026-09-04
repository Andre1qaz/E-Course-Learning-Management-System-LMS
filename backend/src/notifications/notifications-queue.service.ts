import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationType } from '@prisma/client';

// Check if Redis is configured
const hasRedisConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL || 
  process.env.REDIS_HOST || 
  process.env.REDIS_URL
);

// Explicitly disable Redis if not configured for production environments
const isProduction = process.env.NODE_ENV === 'production';
const forceDisableRedis = isProduction && !hasRedisConfig;

// Heuristic #1: Visibility of System Status — queue operations logging
// Heuristic #20: Feedback and Assessment — asynchronous notifications

@Injectable()
export class NotificationsQueueService {
  private readonly logger = new Logger(NotificationsQueueService.name);
  private readonly hasRedis: boolean;

  constructor(
    @Optional() @InjectQueue('notifications') private notificationsQueue?: Queue,
  ) {
    this.hasRedis = !!this.notificationsQueue && !forceDisableRedis;
    if (!this.hasRedis) {
      this.logger.warn('Redis not configured or disabled - notifications queue will operate in fallback mode');
    }
  }

  /**
   * Add a single notification job to the queue
   */
  async addNotificationJob(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping queue for notification to user ${data.userId}`);
      return null;
    }

    try {
      if (!this.notificationsQueue) throw new Error('Notifications queue not available');
      
      const job = await this.notificationsQueue.add(
        'create-notification',
        data,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
      this.logger.log(
        `Added notification job ${job.id} for user ${data.userId}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add notification job: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Add bulk notification job to the queue
   */
  async addBulkNotificationJob(data: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping bulk notification queue for ${data.userIds.length} users`);
      return null;
    }

    try {
      if (!this.notificationsQueue) throw new Error('Notifications queue not available');
      
      const job = await this.notificationsQueue.add(
        'create-bulk-notifications',
        data,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
      this.logger.log(
        `Added bulk notification job ${job.id} for ${data.userIds.length} users`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add bulk notification job: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Add deadline reminder job
   */
  async addDeadlineReminderJob(data: {
    userId: string;
    assignmentTitle: string;
    courseName: string;
    deadlineDate: Date;
  }) {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping deadline reminder queue for user ${data.userId}`);
      return null;
    }

    try {
      if (!this.notificationsQueue) throw new Error('Notifications queue not available');
      
      const job = await this.notificationsQueue.add('deadline-reminder', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        delay: this.calculateDelay(data.deadlineDate),
      });
      this.logger.log(
        `Added deadline reminder job ${job.id} for ${data.deadlineDate}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add deadline reminder job: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Add exam reminder job
   */
  async addExamReminderJob(data: {
    userId: string;
    examTitle: string;
    courseName: string;
    examDate: Date;
  }) {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping exam reminder queue for user ${data.userId}`);
      return null;
    }

    try {
      if (!this.notificationsQueue) throw new Error('Notifications queue not available');
      
      const job = await this.notificationsQueue.add('exam-reminder', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        delay: this.calculateDelay(data.examDate),
      });
      this.logger.log(`Added exam reminder job ${job.id} for ${data.examDate}`);
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add exam reminder job: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Add grade released notification job
   */
  async addGradeReleasedJob(data: {
    userId: string;
    itemType: string;
    itemName: string;
    courseName: string;
  }) {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping grade released queue for user ${data.userId}`);
      return null;
    }

    try {
      if (!this.notificationsQueue) throw new Error('Notifications queue not available');
      
      const job = await this.notificationsQueue.add('grade-released', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      this.logger.log(
        `Added grade released job ${job.id} for user ${data.userId}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add grade released job: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Add forum reply notification job
   */
  async addForumReplyJob(data: {
    userId: string;
    threadTitle: string;
    replierName: string;
  }) {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping forum reply queue for user ${data.userId}`);
      return null;
    }

    try {
      if (!this.notificationsQueue) throw new Error('Notifications queue not available');
      
      const job = await this.notificationsQueue.add('forum-reply', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      this.logger.log(
        `Added forum reply job ${job.id} for user ${data.userId}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add forum reply job: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Add material published notification job
   */
  async addMaterialPublishedJob(data: {
    userId: string;
    materialTitle: string;
    courseName: string;
  }) {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping material published queue for user ${data.userId}`);
      return null;
    }

    try {
      if (!this.notificationsQueue) throw new Error('Notifications queue not available');
      
      const job = await this.notificationsQueue.add(
        'material-published',
        data,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
      this.logger.log(
        `Added material published job ${job.id} for user ${data.userId}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add material published job: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Add assignment created notification job
   */
  async addAssignmentCreatedJob(data: {
    userId: string;
    assignmentTitle: string;
    courseName: string;
    deadline: Date;
  }) {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping assignment created queue for user ${data.userId}`);
      return null;
    }

    try {
      if (!this.notificationsQueue) throw new Error('Notifications queue not available');
      
      const job = await this.notificationsQueue.add(
        'assignment-created',
        data,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
      this.logger.log(
        `Added assignment created job ${job.id} for user ${data.userId}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add assignment created job: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Add quiz created notification job
   */
  async addQuizCreatedJob(data: {
    userId: string;
    quizTitle: string;
    courseName: string;
    startTime: Date;
  }) {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping quiz created queue for user ${data.userId}`);
      return null;
    }

    try {
      if (!this.notificationsQueue) throw new Error('Notifications queue not available');
      
      const job = await this.notificationsQueue.add('quiz-created', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      this.logger.log(
        `Added quiz created job ${job.id} for user ${data.userId}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add quiz created job: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Add exam created notification job
   */
  async addExamCreatedJob(data: {
    userId: string;
    examTitle: string;
    courseName: string;
    startTime: Date;
  }) {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping exam created queue for user ${data.userId}`);
      return null;
    }

    try {
      if (!this.notificationsQueue) throw new Error('Notifications queue not available');
      
      const job = await this.notificationsQueue.add('exam-created', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      this.logger.log(
        `Added exam created job ${job.id} for user ${data.userId}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add exam created job: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Schedule daily deadline reminders (24 hours before deadline)
   */
  async scheduleDailyDeadlineReminders() {
    // This would be called by a cron job to check for upcoming deadlines
    // Implementation would query for assignments with deadlines in 24 hours
    this.logger.log('Scheduling daily deadline reminders');
  }

  /**
   * Calculate delay for scheduled jobs
   */
  private calculateDelay(targetDate: Date): number {
    const now = new Date();
    const target = new Date(targetDate);
    const delay = target.getTime() - now.getTime();

    // Return 0 if the date is in the past
    return delay > 0 ? delay : 0;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (!this.hasRedis || forceDisableRedis) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        status: 'disabled',
      };
    }

    if (!this.notificationsQueue) throw new Error('Notifications queue not available');

    const [waiting, active, completed, failed] = await Promise.all([
      this.notificationsQueue.getWaitingCount(),
      this.notificationsQueue.getActiveCount(),
      this.notificationsQueue.getCompletedCount(),
      this.notificationsQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      status: 'active',
    };
  }
}
