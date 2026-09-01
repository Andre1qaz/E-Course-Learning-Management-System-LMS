import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarModule } from '../calendar/calendar.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [CalendarModule, NotificationsModule, StorageModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, PrismaService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
