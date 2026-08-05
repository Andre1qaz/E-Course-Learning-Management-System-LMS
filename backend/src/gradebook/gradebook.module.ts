import { Module } from '@nestjs/common';
import { GradebookController } from './gradebook.controller';
import { GradebookService } from './gradebook.service';
import { GradebookProcessor } from './gradebook.processor';
import { GradebookQueueService } from './gradebook-queue.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'gradebook',
    }),
  ],
  controllers: [GradebookController],
  providers: [GradebookService, GradebookProcessor, GradebookQueueService],
  exports: [GradebookService, GradebookQueueService],
})
export class GradebookModule {}
