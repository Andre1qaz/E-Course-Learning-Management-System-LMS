import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { EmailQueueService } from './email-queue.service';
import { EmailController } from './email.controller';
import emailConfig from './email.config';

@Module({
  imports: [
    ConfigModule.forFeature(emailConfig),
    BullModule.registerQueueAsync({
      name: 'email-queue',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const emailConfig = configService.get('email');
        return {
          connection: {
            host: emailConfig.redis.host,
            port: emailConfig.redis.port,
            password: emailConfig.redis.password,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProcessor, EmailQueueService],
  exports: [EmailService, EmailQueueService],
})
export class EmailModule {}
