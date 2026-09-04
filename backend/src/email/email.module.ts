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

// Explicitly disable Redis if not configured for production environments
const isProduction = process.env.NODE_ENV === 'production';
const forceDisableRedis = isProduction && !hasRedisConfig;

if (forceDisableRedis) {
  console.log('🚫 Production environment without Redis - email queues disabled');
}

// Create dynamic module based on Redis availability
const createEmailModule = () => {
  const baseModule = {
    imports: [
      ConfigModule.forFeature(emailConfig),
    ],
    controllers: [EmailController],
    providers: [EmailService],
    exports: [EmailService],
  };

  if (!hasRedisConfig || forceDisableRedis) {
    console.log('⚠️ Redis not configured or disabled - EmailModule running without queue functionality');
    // Still provide EmailQueueService but without queue functionality
    // Don't include EmailProcessor as it requires BullMQ
    return {
      ...baseModule,
      providers: [...baseModule.providers, EmailQueueService],
      exports: [...baseModule.exports, EmailQueueService],
    };
  }

  return {
    ...baseModule,
    imports: [
      ...baseModule.imports,
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
              // Add Render-friendly settings - maxRetriesPerRequest must be null for BullMQ
              maxRetriesPerRequest: null, // Required by BullMQ
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
    ],
    providers: [...baseModule.providers, EmailProcessor, EmailQueueService],
    exports: [...baseModule.exports, EmailQueueService],
  };
};

@Module(createEmailModule())
export class EmailModule {}
