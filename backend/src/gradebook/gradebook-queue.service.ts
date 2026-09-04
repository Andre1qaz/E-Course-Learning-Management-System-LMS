import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

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
// Heuristic #20: Feedback and Assessment — asynchronous gradebook exports

@Injectable()
export class GradebookQueueService {
  private readonly logger = new Logger(GradebookQueueService.name);
  private readonly hasRedis: boolean;

  constructor(@Optional() @InjectQueue('gradebook') private gradebookQueue?: Queue) {
    this.hasRedis = !!this.gradebookQueue && !forceDisableRedis;
    if (!this.hasRedis) {
      this.logger.warn('Redis not configured or disabled - gradebook queue will operate in fallback mode');
    }
  }

  /**
   * Add gradebook export job to the queue
   */
  async addExportJob(data: {
    courseId: string;
    userId: string;
    format: 'excel' | 'csv';
  }) {
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping gradebook export queue for course ${data.courseId}`);
      return null;
    }

    try {
      if (!this.gradebookQueue) throw new Error('Gradebook queue not available');
      
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
    if (!this.hasRedis || forceDisableRedis) {
      this.logger.warn(`Redis not available or disabled - skipping grade recalculation queue for course ${data.courseId}`);
      return null;
    }

    try {
      if (!this.gradebookQueue) throw new Error('Gradebook queue not available');
      
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
    if (!this.hasRedis || forceDisableRedis) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        status: 'disabled',
      };
    }

    if (!this.gradebookQueue) throw new Error('Gradebook queue not available');

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
      status: 'active',
    };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
    if (!this.hasRedis || forceDisableRedis) {
      return null;
    }

    try {
      if (!this.gradebookQueue) throw new Error('Gradebook queue not available');
      
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
