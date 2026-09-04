import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { StorageModule } from './storage/storage.module';
import { ModulesModule } from './modules/modules.module';
import { CourseCategoriesModule } from './course-categories/course-categories.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { ExamsModule } from './exams/exams.module';
import { QuestionBanksModule } from './question-banks/question-banks.module';
import { CalendarModule } from './calendar/calendar.module';
import { ForumModule } from './forum/forum.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrivateFilesModule } from './private-files/private-files.module';
import { WeeksModule } from './weeks/weeks.module';
import { ActivitiesModule } from './activities/activities.module';
import { GradebookModule } from './gradebook/gradebook.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CourseProgressModule } from './course-progress/course-progress.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { WebSocketModule } from './websocket/websocket.module';
import { EmailModule } from './email/email.module';

// Check if Redis is configured
const hasRedisConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL || 
  process.env.REDIS_HOST || 
  process.env.REDIS_URL
);

// Create BullMQ configuration with Render-friendly settings
const createBullConfig = () => {
  if (!hasRedisConfig) {
    console.log('⚠️ Redis not configured - BullMQ queues will be disabled');
    return null;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = process.env.RENDER === 'true' || process.env.RENDER_SERVICE_ID;

  if (process.env.UPSTASH_REDIS_REST_URL) {
    return {
      connection: {
        host: new URL(process.env.UPSTASH_REDIS_REST_URL).hostname,
        port: parseInt(new URL(process.env.UPSTASH_REDIS_REST_URL).port || '6379', 10),
        username: 'default',
        password: process.env.UPSTASH_REDIS_REST_TOKEN,
        tls: {},
        // Render/production-friendly settings - maxRetriesPerRequest must be null for BullMQ
        maxRetriesPerRequest: null, // Required by BullMQ
        retryDelayOnFailover: isRender ? 200 : 100,
        connectTimeout: isRender ? 30000 : 10000, // 30s for Render's cold starts
        commandTimeout: isRender ? 15000 : 5000, // 15s for Render
        enableReadyCheck: false,
        lazyConnect: true,
        keepAlive: isRender ? 60000 : 30000, // 60s for Render
        reconnectOnError: (err: Error) => {
          // Reconnect on specific errors
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      },
    };
  }

  return {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null, // Required by BullMQ
      retryDelayOnFailover: 100,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableReadyCheck: false,
      lazyConnect: true,
      keepAlive: 30000,
    },
  };
};

const bullConfig = createBullConfig();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    // Only include BullMQ if Redis is configured
    ...(bullConfig ? [BullModule.forRoot(bullConfig)] : []),
    PrismaModule,
    AuthModule,
    CoursesModule,
    StorageModule,
    ModulesModule,
    CourseCategoriesModule,
    AssignmentsModule,
    ExamsModule,
    QuestionBanksModule,
    CalendarModule,
    ForumModule,
    NotificationsModule,
    PrivateFilesModule,
    WeeksModule,
    ActivitiesModule,
    GradebookModule,
    AnnouncementsModule,
    DashboardModule,
    CourseProgressModule,
    QuizzesModule,
    WebSocketModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
