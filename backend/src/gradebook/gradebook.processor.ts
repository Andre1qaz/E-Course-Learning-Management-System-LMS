import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { GradebookService } from './gradebook.service';

// Heuristic #1: Visibility of System Status — job processing logs
// Heuristic #20: Feedback and Assessment — asynchronous gradebook operations

@Processor('gradebook')
export class GradebookProcessor extends WorkerHost {
  private readonly logger = new Logger(GradebookProcessor.name);

  constructor(private gradebookService: GradebookService) {
    super();
  }

  async process(job: Job): Promise<any> {
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
    } catch (error: any) {
      this.logger.error(`Gradebook export failed: ${error.message}`);
      throw error;
    }
  }

  private async handleRecalculateGrades(job: Job) {
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
    } catch (error: any) {
      this.logger.error(`Grade recalculation failed: ${error.message}`);
      throw error;
    }
  }

}