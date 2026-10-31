import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailOptions } from './interfaces/email.interface';
import { EmailService } from './email.service';

// Check if Redis is configured
const hasRedisConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL || 
  process.env.REDIS_HOST || 
  process.env.REDIS_URL
);

// Explicitly disable Redis if not configured for production environments
const isProduction = process.env.NODE_ENV === 'production';
const forceDisableRedis = isProduction && (!hasRedisConfig || process.env.ENABLE_QUEUES !== 'true');

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  private readonly hasRedis: boolean;

  constructor(
    private readonly emailService: EmailService,
    @Optional() @InjectQueue('email-queue') private readonly emailQueue?: Queue,
  ) {
    this.hasRedis = !!this.emailQueue && !forceDisableRedis;
    if (!this.hasRedis) {
      this.logger.warn('Redis not configured or disabled - email queue will operate in fallback mode');
    }
  }

  async addEmailJob(options: EmailOptions): Promise<void> {
    if (!this.hasRedis || forceDisableRedis) {
      // No queue: send directly so transactional emails still go out.
      try {
        await this.emailService.sendEmail(options);
      } catch (error) {
        this.logger.error(
          `Failed to send email directly to ${options.to}: ${(error as Error).message}`,
        );
      }
      return;
    }

    try {
      if (!this.emailQueue) throw new Error('Email queue not available');
      
      await this.emailQueue.add('send-email', options, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 50,
      });
      this.logger.log(`Email job added to queue for ${options.to}`);
    } catch (error) {
      this.logger.error(`Error adding email job to queue:`, error);
      throw error;
    }
  }

  async addForgotPasswordJob(
    email: string,
    name: string,
    resetToken: string,
    resetUrl: string,
  ): Promise<void> {
    if (!this.hasRedis || forceDisableRedis) {
      try {
        await this.emailService.sendForgotPasswordEmail(
          email,
          name,
          resetToken,
          resetUrl,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send forgot password email directly to ${email}: ${(error as Error).message}`,
        );
      }
      return;
    }

    try {
      if (!this.emailQueue) throw new Error('Email queue not available');
      
      await this.emailQueue.add(
        'send-forgot-password',
        {
          email,
          name,
          resetToken,
          resetUrl,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 50,
        },
      );
      this.logger.log(`Forgot password email job added to queue for ${email}`);
    } catch (error) {
      this.logger.error(`Error adding forgot password job to queue:`, error);
      throw error;
    }
  }

  async addWelcomeJob(
    email: string,
    name: string,
    loginUrl: string,
  ): Promise<void> {
    if (!this.hasRedis || forceDisableRedis) {
      try {
        await this.emailService.sendWelcomeEmail(email, name, loginUrl);
      } catch (error) {
        this.logger.error(
          `Failed to send welcome email directly to ${email}: ${(error as Error).message}`,
        );
      }
      return;
    }

    try {
      if (!this.emailQueue) throw new Error('Email queue not available');
      
      await this.emailQueue.add(
        'send-welcome',
        {
          email,
          name,
          loginUrl,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 50,
        },
      );
      this.logger.log(`Welcome email job added to queue for ${email}`);
    } catch (error) {
      this.logger.error(`Error adding welcome job to queue:`, error);
      throw error;
    }
  }

  async addNotificationJob(
    email: string,
    name: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionText?: string,
  ): Promise<void> {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping queue for notification email to ${email}`);
      return;
    }

    try {
      if (!this.emailQueue) throw new Error('Email queue not available');
      
      await this.emailQueue.add(
        'send-notification',
        {
          email,
          name,
          title,
          message,
          actionUrl,
          actionText,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 50,
        },
      );
      this.logger.log(`Notification email job added to queue for ${email}`);
    } catch (error) {
      this.logger.error(`Error adding notification job to queue:`, error);
      throw error;
    }
  }

  async addCourseEnrollmentJob(
    email: string,
    name: string,
    courseName: string,
    instructorName: string,
    courseDescription: string,
    courseUrl: string,
  ): Promise<void> {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping queue for course enrollment email to ${email}`);
      return;
    }

    try {
      if (!this.emailQueue) throw new Error('Email queue not available');
      
      await this.emailQueue.add(
        'send-course-enrollment',
        {
          email,
          name,
          courseName,
          instructorName,
          courseDescription,
          courseUrl,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 50,
        },
      );
      this.logger.log(
        `Course enrollment email job added to queue for ${email}`,
      );
    } catch (error) {
      this.logger.error(`Error adding course enrollment job to queue:`, error);
      throw error;
    }
  }

  async addAssignmentDueJob(
    email: string,
    name: string,
    assignmentTitle: string,
    courseName: string,
    dueDate: string,
    timeRemaining: string,
    assignmentUrl: string,
  ): Promise<void> {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping queue for assignment due email to ${email}`);
      return;
    }

    try {
      if (!this.emailQueue) throw new Error('Email queue not available');
      
      await this.emailQueue.add(
        'send-assignment-due',
        {
          email,
          name,
          assignmentTitle,
          courseName,
          dueDate,
          timeRemaining,
          assignmentUrl,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 50,
        },
      );
      this.logger.log(`Assignment due email job added to queue for ${email}`);
    } catch (error) {
      this.logger.error(`Error adding assignment due job to queue:`, error);
      throw error;
    }
  }

  async addExamReminderJob(
    email: string,
    name: string,
    examTitle: string,
    courseName: string,
    examDate: string,
    examTime: string,
    duration: string,
    examUrl: string,
  ): Promise<void> {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping queue for exam reminder email to ${email}`);
      return;
    }

    try {
      if (!this.emailQueue) throw new Error('Email queue not available');
      
      await this.emailQueue.add(
        'send-exam-reminder',
        {
          email,
          name,
          examTitle,
          courseName,
          examDate,
          examTime,
          duration,
          examUrl,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 50,
        },
      );
      this.logger.log(`Exam reminder email job added to queue for ${email}`);
    } catch (error) {
      this.logger.error(`Error adding exam reminder job to queue:`, error);
      throw error;
    }
  }

  async addForumReplyJob(
    email: string,
    name: string,
    replierName: string,
    originalPost: string,
    replyContent: string,
    forumUrl: string,
  ): Promise<void> {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping queue for forum reply email to ${email}`);
      return;
    }

    try {
      if (!this.emailQueue) throw new Error('Email queue not available');
      
      await this.emailQueue.add(
        'send-forum-reply',
        {
          email,
          name,
          replierName,
          originalPost,
          replyContent,
          forumUrl,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 50,
        },
      );
      this.logger.log(`Forum reply email job added to queue for ${email}`);
    } catch (error) {
      this.logger.error(`Error adding forum reply job to queue:`, error);
      throw error;
    }
  }

  async getQueueStats(): Promise<any> {
    if (!this.hasRedis || forceDisableRedis) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        status: 'disabled',
      };
    }

    try {
      if (!this.emailQueue) throw new Error('Email queue not available');
      
      const [waiting, active, completed, failed] = await Promise.all([
        this.emailQueue.getWaitingCount(),
        this.emailQueue.getActiveCount(),
        this.emailQueue.getCompletedCount(),
        this.emailQueue.getFailedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        status: 'active',
      };
    } catch (error) {
      this.logger.error(`Error getting queue stats:`, error);
      throw error;
    }
  }
}
