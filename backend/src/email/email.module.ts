import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { EmailQueueService } from './email-queue.service';
import { EmailController } from './email.controller';
import emailConfig from './email.config';

// Check if Redis is configured
const hasRedisConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL || 
  process.env.REDIS_HOST || 
  process.env.REDIS_URL
);

@Module({
  imports: [
    ConfigModule.forFeature(emailConfig),
    // Only register BullMQ queue if Redis is configured
    ...(hasRedisConfig ? [
      BullModule.registerQueueAsync({
        name: 'email-queue',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => {
          const emailConfig = configService.get('email');
          const isRender = process.env.RENDER === 'true' || process.env.RENDER_SERVICE_ID;
          
          return {
            connection: {
              host: emailConfig.redis.host,
              port: emailConfig.redis.port,
              password: emailConfig.redis.password,
              // Add Render-friendly settings
              maxRetriesPerRequest: isRender ? 2 : 3,
              retryDelayOnFailover: isRender ? 200 : 100,
              connectTimeout: isRender ? 30000 : 10000,
              commandTimeout: isRender ? 15000 : 5000,
              enableReadyCheck: false,
              lazyConnect: true,
              keepAlive: isRender ? 60000 : 30000,
            },
          };
        },
        inject: [ConfigService],
      }),
    ] : []),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProcessor, EmailQueueService],
  exports: [EmailService, EmailQueueService],
})
export class EmailModule {}
