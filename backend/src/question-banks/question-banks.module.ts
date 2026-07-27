import { Module } from '@nestjs/common';
import { QuestionBanksService } from './question-banks.service';
import { QuestionBanksController } from './question-banks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionBanksController],
  providers: [QuestionBanksService],
  exports: [QuestionBanksService],
})
export class QuestionBanksModule {}
