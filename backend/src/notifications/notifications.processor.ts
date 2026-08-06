import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

// Heuristic #1: Visibility of System Status — job processing logs
// Heuristic #20: Feedback and Assessment — automated notifications

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private notificationsService: NotificationsService) {}

  async handleCreateNotification(job: Job) {
    this.logger.log(`Processing notification job ${job.id}: ${job.data.title}`);
    
    return await this.notificationsService.createNotification({
      userId: job.data.userId,
      type: job.data.type,
      title: job.data.title,
      message: job.data.message,
      link: job.data.link,
    });
  }

  async handleCreateBulkNotifications(job: Job) {
    this.logger.log(`Processing bulk notification job ${job.id} for ${job.data.userIds.length} users`);
    
    return await this.notificationsService.createBulkNotifications({
      userIds: job.data.userIds,
      type: job.data.type,
      title: job.data.title,
      message: job.data.message,
      link: job.data.link,
    });
  }

  async handleDeadlineReminder(job: Job) {
    this.logger.log(`Processing deadline reminder job ${job.id}`);
    
    return await this.notificationsService.createDeadlineReminder(
      job.data.userId,
      job.data.assignmentTitle,
      job.data.courseName,
      new Date(job.data.deadlineDate),
    );
  }

  async handleExamReminder(job: Job) {
    this.logger.log(`Processing exam reminder job ${job.id}`);
    
    return await this.notificationsService.createExamReminder(
      job.data.userId,
      job.data.examTitle,
      job.data.courseName,
      new Date(job.data.examDate),
    );
  }

  async handleGradeReleased(job: Job) {
    this.logger.log(`Processing grade released job ${job.id}`);
    
    return await this.notificationsService.createGradeReleased(
      job.data.userId,
      job.data.itemType,
      job.data.itemName,
      job.data.courseName,
    );
  }

  async handleForumReply(job: Job) {
    this.logger.log(`Processing forum reply job ${job.id}`);
    
    return await this.notificationsService.createForumReplyNotification(
      job.data.userId,
      job.data.threadTitle,
      job.data.replierName,
    );
  }

  async handleMaterialPublished(job: Job) {
    this.logger.log(`Processing material published job ${job.id}`);
    
    return await this.notificationsService.createMaterialPublishedNotification(
      job.data.userId,
      job.data.materialTitle,
      job.data.courseName,
    );
  }

  async handleAssignmentCreated(job: Job) {
    this.logger.log(`Processing assignment created job ${job.id}`);
    
    return await this.notificationsService.createAssignmentCreatedNotification(
      job.data.userId,
      job.data.assignmentTitle,
      job.data.courseName,
      new Date(job.data.deadline),
    );
  }

  async handleQuizCreated(job: Job) {
    this.logger.log(`Processing quiz created job ${job.id}`);
    
    return await this.notificationsService.createQuizCreatedNotification(
      job.data.userId,
      job.data.quizTitle,
      job.data.courseName,
      new Date(job.data.startTime),
    );
  }

  async handleExamCreated(job: Job) {
    this.logger.log(`Processing exam created job ${job.id}`);
    
    return await this.notificationsService.createExamCreatedNotification(
      job.data.userId,
      job.data.examTitle,
      job.data.courseName,
      new Date(job.data.startTime),
    );
  }
}