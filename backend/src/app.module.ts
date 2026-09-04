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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    BullModule.forRoot({
      connection: process.env.UPSTASH_REDIS_REST_URL
        ? {
            host: new URL(process.env.UPSTASH_REDIS_REST_URL).hostname,
            port: parseInt(new URL(process.env.UPSTASH_REDIS_REST_URL).port || '6379', 10),
            username: 'default',
            password: process.env.UPSTASH_REDIS_REST_TOKEN,
            tls: {},
            // Use Redis client options compatible with Upstash
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
          }
        : {
            host: process.env.REDIS_HOST ?? 'localhost',
            port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
            password: process.env.REDIS_PASSWORD,
          },
    }),
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
