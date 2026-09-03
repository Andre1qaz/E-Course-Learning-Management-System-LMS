import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from './email.service';
import { EmailOptions } from './interfaces/email.interface';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing email job ${job.id} with name ${job.name}`);

    switch (job.name) {
      case 'send-email':
        return this.handleSendEmail(job);
      case 'send-forgot-password':
        return this.handleForgotPassword(job);
      case 'send-welcome':
        return this.handleWelcome(job);
      case 'send-notification':
        return this.handleNotification(job);
      case 'send-course-enrollment':
        return this.handleCourseEnrollment(job);
      case 'send-assignment-due':
        return this.handleAssignmentDue(job);
      case 'send-exam-reminder':
        return this.handleExamReminder(job);
      case 'send-forum-reply':
        return this.handleForumReply(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  async handleSendEmail(job: Job<EmailOptions>) {
    this.logger.log(`Processing email job ${job.id} for ${job.data.to}`);

    try {
      await this.emailService.sendEmail(job.data);
      this.logger.log(`Email job ${job.id} completed successfully`);
      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed:`, error);
      throw error; // This will trigger BullMQ's retry mechanism
    }
  }

  async handleForgotPassword(job: Job) {
    this.logger.log(`Processing forgot password email job ${job.id}`);

    try {
      const { email, name, resetToken, resetUrl } = job.data;
      await this.emailService.sendForgotPasswordEmail(
        email,
        name,
        resetToken,
        resetUrl,
      );
      this.logger.log(
        `Forgot password email job ${job.id} completed successfully`,
      );
      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Forgot password email job ${job.id} failed:`, error);
      throw error;
    }
  }

  async handleWelcome(job: Job) {
    this.logger.log(`Processing welcome email job ${job.id}`);

    try {
      const { email, name, loginUrl } = job.data;
      await this.emailService.sendWelcomeEmail(email, name, loginUrl);
      this.logger.log(`Welcome email job ${job.id} completed successfully`);
      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Welcome email job ${job.id} failed:`, error);
      throw error;
    }
  }

  async handleNotification(job: Job) {
    this.logger.log(`Processing notification email job ${job.id}`);

    try {
      const { email, name, title, message, actionUrl, actionText } = job.data;
      await this.emailService.sendNotificationEmail(
        email,
        name,
        title,
        message,
        actionUrl,
        actionText,
      );
      this.logger.log(
        `Notification email job ${job.id} completed successfully`,
      );
      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Notification email job ${job.id} failed:`, error);
      throw error;
    }
  }

  async handleCourseEnrollment(job: Job) {
    this.logger.log(`Processing course enrollment email job ${job.id}`);

    try {
      const {
        email,
        name,
        courseName,
        instructorName,
        courseDescription,
        courseUrl,
      } = job.data;
      await this.emailService.sendCourseEnrollmentEmail(
        email,
        name,
        courseName,
        instructorName,
        courseDescription,
        courseUrl,
      );
      this.logger.log(
        `Course enrollment email job ${job.id} completed successfully`,
      );
      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Course enrollment email job ${job.id} failed:`, error);
      throw error;
    }
  }

  async handleAssignmentDue(job: Job) {
    this.logger.log(`Processing assignment due email job ${job.id}`);

    try {
      const {
        email,
        name,
        assignmentTitle,
        courseName,
        dueDate,
        timeRemaining,
        assignmentUrl,
      } = job.data;
      await this.emailService.sendAssignmentDueEmail(
        email,
        name,
        assignmentTitle,
        courseName,
        dueDate,
        timeRemaining,
        assignmentUrl,
      );
      this.logger.log(
        `Assignment due email job ${job.id} completed successfully`,
      );
      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Assignment due email job ${job.id} failed:`, error);
      throw error;
    }
  }

  async handleExamReminder(job: Job) {
    this.logger.log(`Processing exam reminder email job ${job.id}`);

    try {
      const {
        email,
        name,
        examTitle,
        courseName,
        examDate,
        examTime,
        duration,
        examUrl,
      } = job.data;
      await this.emailService.sendExamReminderEmail(
        email,
        name,
        examTitle,
        courseName,
        examDate,
        examTime,
        duration,
        examUrl,
      );
      this.logger.log(
        `Exam reminder email job ${job.id} completed successfully`,
      );
      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Exam reminder email job ${job.id} failed:`, error);
      throw error;
    }
  }

  async handleForumReply(job: Job) {
    this.logger.log(`Processing forum reply email job ${job.id}`);

    try {
      const { email, name, replierName, originalPost, replyContent, forumUrl } =
        job.data;
      await this.emailService.sendForumReplyEmail(
        email,
        name,
        replierName,
        originalPost,
        replyContent,
        forumUrl,
      );
      this.logger.log(`Forum reply email job ${job.id} completed successfully`);
      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Forum reply email job ${job.id} failed:`, error);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error:`, error);
  }
}
