import { Module } from '@nestjs/common';
import { WeeksService } from './weeks.service';
import { WeeksController } from './weeks.controller';

@Module({
  controllers: [WeeksController],
  providers: [WeeksService],
  exports: [WeeksService],
})
export class WeeksModule {}
