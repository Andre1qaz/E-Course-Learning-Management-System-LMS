import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsQueueService } from './notifications-queue.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { WebSocketModule } from '../websocket/websocket.module';

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
        name: 'notifications',
      }),
    ] : []),
    WebSocketModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ...(hasRedisConfig && !forceDisableRedis ? [NotificationsProcessor] : []),
    NotificationsQueueService,
  ],
  exports: [NotificationsService, NotificationsQueueService],
})
export class NotificationsModule {}
