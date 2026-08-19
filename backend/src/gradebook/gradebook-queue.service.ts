import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// Heuristic #1: Visibility of System Status — queue operations logging
// Heuristic #20: Feedback and Assessment — asynchronous gradebook exports

@Injectable()
export class GradebookQueueService {
  private readonly logger = new Logger(GradebookQueueService.name);

  constructor(@InjectQueue('gradebook') private gradebookQueue: Queue) {}

  /**
   * Add gradebook export job to the queue
   */
  async addExportJob(data: {
    courseId: string;
    userId: string;
    format: 'excel' | 'csv';
  }) {
    try {
      const job = await this.gradebookQueue.add('export-gradebook', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
          age: 3600 * 24, // Remove jobs older than 24 hours
        },
        removeOnFail: {
          count: 5000, // Keep last 5000 failed jobs
        },
      });
      this.logger.log(
        `Added gradebook export job ${job.id} for course ${data.courseId} as ${data.format}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add gradebook export job: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Add bulk grade recalculation job to the queue
   */
  async addRecalculateJob(data: { courseId: string; userId: string }) {
    try {
      const job = await this.gradebookQueue.add('recalculate-grades', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      this.logger.log(
        `Added grade recalculation job ${job.id} for course ${data.courseId}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add grade recalculation job: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.gradebookQueue.getWaitingCount(),
      this.gradebookQueue.getActiveCount(),
      this.gradebookQueue.getCompletedCount(),
      this.gradebookQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
    try {
      const job = await this.gradebookQueue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      return {
        id: job.id,
        name: job.name,
        data: job.data,
        state,
        progress: job.progress,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get job status: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
