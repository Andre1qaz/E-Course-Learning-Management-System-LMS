import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Optional } from '@nestjs/common';
import { GradebookService } from './gradebook.service';

// Check if Redis is configured
const hasRedisConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL || 
  process.env.REDIS_HOST || 
  process.env.REDIS_URL
);

// Explicitly disable Redis if not configured for production environments
const isProduction = process.env.NODE_ENV === 'production';
const forceDisableRedis = isProduction && !hasRedisConfig;

// Heuristic #1: Visibility of System Status — job processing logs
// Heuristic #20: Feedback and Assessment — asynchronous gradebook operations

@Processor('gradebook')
export class GradebookProcessor extends WorkerHost {
  private readonly logger = new Logger(GradebookProcessor.name);

  constructor(@Optional() private gradebookService?: GradebookService) {
    super();
    if (!hasRedisConfig || forceDisableRedis) {
      this.logger.warn('Redis not configured or disabled - Gradebook processor will be disabled');
    }
  }

  async process(job: Job): Promise<any> {
    if (!hasRedisConfig || forceDisableRedis || !this.gradebookService) {
      this.logger.warn(`Redis not configured or disabled - skipping gradebook job ${job.id}`);
      return { success: false, reason: 'Redis not configured or disabled' };
    }

    this.logger.log(`Processing gradebook job ${job.id} (${job.name})`);

    switch (job.name) {
      case 'export-gradebook':
        return this.handleExportGradebook(job);

      case 'recalculate-grades':
        return this.handleRecalculateGrades(job);

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleExportGradebook(job: Job) {
    this.logger.log(
      `Processing gradebook export job ${job.id} for course ${job.data.courseId}`,
    );

    if (!this.gradebookService) {
      this.logger.warn('Gradebook service not available');
      return { success: false, reason: 'Service not available' };
    }

    // Update progress
    await job.updateProgress(10);

    try {
      const result = await this.gradebookService.exportGradebook(
        job.data.courseId,
        job.data.format,
        job.data.userId,
        'ADMIN', // Queue jobs are typically initiated by admins/lecturers
      );

      await job.updateProgress(100);
      return result;
    } catch (error: any) {
      this.logger.error(`Gradebook export failed: ${error.message}`);
      throw error;
    }
  }

  private async handleRecalculateGrades(job: Job) {
    this.logger.log(
      `Processing grade recalculation job ${job.id} for course ${job.data.courseId}`,
    );

    if (!this.gradebookService) {
      this.logger.warn('Gradebook service not available');
      return { success: false, reason: 'Service not available' };
    }

    // Update progress
    await job.updateProgress(10);

    try {
      const result = await this.gradebookService.recalculateGrades(
        job.data.courseId,
        job.data.userId,
        'ADMIN', // Queue jobs are typically initiated by admins/lecturers
      );

      await job.updateProgress(100);
      return result;
    } catch (error: any) {
      this.logger.error(`Grade recalculation failed: ${error.message}`);
      throw error;
    }
  }
}
