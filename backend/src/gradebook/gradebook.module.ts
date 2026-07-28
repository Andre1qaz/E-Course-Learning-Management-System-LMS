import { Module } from '@nestjs/common';
import { GradebookController } from './gradebook.controller';
import { GradebookService } from './gradebook.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GradebookController],
  providers: [GradebookService],
  exports: [GradebookService],
})
export class GradebookModule {}
