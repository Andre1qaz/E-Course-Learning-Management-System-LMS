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
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
