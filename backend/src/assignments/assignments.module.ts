import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { RubricsController } from './rubrics.controller';
import { RubricsService } from './rubrics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CalendarModule } from '../calendar/calendar.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, CalendarModule, NotificationsModule],
  controllers: [AssignmentsController, RubricsController],
  providers: [AssignmentsService, RubricsService],
  exports: [AssignmentsService, RubricsService],
})
export class AssignmentsModule {}
