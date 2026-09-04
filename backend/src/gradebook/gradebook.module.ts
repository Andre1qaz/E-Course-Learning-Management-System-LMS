import { Module } from '@nestjs/common';
import { GradebookController } from './gradebook.controller';
import { GradebookService } from './gradebook.service';
import { GradebookProcessor } from './gradebook.processor';
import { GradebookQueueService } from './gradebook-queue.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';

// Check if Redis is configured
const hasRedisConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL || 
  process.env.REDIS_HOST || 
  process.env.REDIS_URL
);

// Explicitly disable Redis if not configured for production environments
const isProduction = process.env.NODE_ENV === 'production';
const forceDisableRedis = isProduction && !hasRedisConfig;

@Module({
  imports: [
    PrismaModule,
    // Only register BullMQ queue if Redis is configured
    ...(hasRedisConfig && !forceDisableRedis ? [
      BullModule.registerQueue({
        name: 'gradebook',
      }),
    ] : []),
  ],
  controllers: [GradebookController],
  providers: [
    GradebookService,
    ...(hasRedisConfig && !forceDisableRedis ? [GradebookProcessor] : []),
    GradebookQueueService,
  ],
  exports: [GradebookService, GradebookQueueService],
})
export class GradebookModule {}
