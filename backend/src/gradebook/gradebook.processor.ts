import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { GradebookService } from './gradebook.service';

// Heuristic #1: Visibility of System Status — job processing logs
// Heuristic #20: Feedback and Assessment — asynchronous gradebook operations

@Processor('gradebook')
export class GradebookProcessor {
  private readonly logger = new Logger(GradebookProcessor.name);

  constructor(private gradebookService: GradebookService) {}

  @Process('export-gradebook')
  async handleExportGradebook(job: Job) {
    this.logger.log(`Processing gradebook export job ${job.id} for course ${job.data.courseId}`);
    
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
    } catch (error) {
      this.logger.error(`Gradebook export failed: ${error.message}`);
      throw error;
    }
  }

  @Process('recalculate-grades')
  async handleRecalculateGrades(job: Job) {
    this.logger.log(`Processing grade recalculation job ${job.id} for course ${job.data.courseId}`);
    
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
    } catch (error) {
      this.logger.error(`Grade recalculation failed: ${error.message}`);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Completed job ${job.id} of type ${job.name}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Failed job ${job.id} of type ${job.name}: ${error.message}`);
  }
}