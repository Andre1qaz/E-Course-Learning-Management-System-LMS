import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

// Heuristic #1: Visibility of System Status — job processing logs
// Heuristic #20: Feedback and Assessment — automated notifications

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing notification job ${job.id} (${job.name})`);

    switch (job.name) {
      case 'create-notification':
        return this.handleCreateNotification(job);

      case 'create-bulk-notifications':
        return this.handleCreateBulkNotifications(job);

      case 'deadline-reminder':
        return this.handleDeadlineReminder(job);

      case 'exam-reminder':
        return this.handleExamReminder(job);

      case 'grade-released':
        return this.handleGradeReleased(job);

      case 'forum-reply':
        return this.handleForumReply(job);

      case 'material-published':
        return this.handleMaterialPublished(job);

      case 'assignment-created':
        return this.handleAssignmentCreated(job);

      case 'quiz-created':
        return this.handleQuizCreated(job);

      case 'exam-created':
        return this.handleExamCreated(job);

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleCreateNotification(job: Job) {
    return await this.notificationsService.createNotification({
      userId: job.data.userId,
      type: job.data.type,
      title: job.data.title,
      message: job.data.message,
      link: job.data.link,
    });
  }

  private async handleCreateBulkNotifications(job: Job) {
    return await this.notificationsService.createBulkNotifications({
      userIds: job.data.userIds,
      type: job.data.type,
      title: job.data.title,
      message: job.data.message,
      link: job.data.link,
    });
  }

  private async handleDeadlineReminder(job: Job) {
    return await this.notificationsService.createDeadlineReminder(
      job.data.userId,
      job.data.assignmentTitle,
      job.data.courseName,
      new Date(job.data.deadlineDate),
    );
  }

  private async handleExamReminder(job: Job) {
    return await this.notificationsService.createExamReminder(
      job.data.userId,
      job.data.examTitle,
      job.data.courseName,
      new Date(job.data.examDate),
    );
  }

  private async handleGradeReleased(job: Job) {
    return await this.notificationsService.createGradeReleased(
      job.data.userId,
      job.data.itemType,
      job.data.itemName,
      job.data.courseName,
    );
  }

  private async handleForumReply(job: Job) {
    return await this.notificationsService.createForumReplyNotification(
      job.data.userId,
      job.data.threadTitle,
      job.data.replierName,
    );
  }

  private async handleMaterialPublished(job: Job) {
    return await this.notificationsService.createMaterialPublishedNotification(
      job.data.userId,
      job.data.materialTitle,
      job.data.courseName,
    );
  }

  private async handleAssignmentCreated(job: Job) {
    return await this.notificationsService.createAssignmentCreatedNotification(
      job.data.userId,
      job.data.assignmentTitle,
      job.data.courseName,
      new Date(job.data.deadline),
    );
  }

  private async handleQuizCreated(job: Job) {
    return await this.notificationsService.createQuizCreatedNotification(
      job.data.userId,
      job.data.quizTitle,
      job.data.courseName,
      new Date(job.data.startTime),
    );
  }

  private async handleExamCreated(job: Job) {
    return await this.notificationsService.createExamCreatedNotification(
      job.data.userId,
      job.data.examTitle,
      job.data.courseName,
      new Date(job.data.startTime),
    );
  }
}