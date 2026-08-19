import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationType } from '@prisma/client';

// Heuristic #1: Visibility of System Status — queue operations logging
// Heuristic #20: Feedback and Assessment — asynchronous notifications

@Injectable()
export class NotificationsQueueService {
  private readonly logger = new Logger(NotificationsQueueService.name);

  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

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
    try {
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
    try {
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
    try {
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
    try {
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
    try {
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
    try {
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
    try {
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
    try {
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
    try {
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
    try {
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
    };
  }
}
