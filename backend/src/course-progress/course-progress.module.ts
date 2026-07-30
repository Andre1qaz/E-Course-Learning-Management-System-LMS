import { Module } from '@nestjs/common';
import { CourseProgressController } from './course-progress.controller';
import { CourseProgressService } from './course-progress.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CourseProgressController],
  providers: [CourseProgressService],
  exports: [CourseProgressService],
})
export class CourseProgressModule {}
