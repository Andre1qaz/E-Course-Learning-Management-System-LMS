import { Controller, Get, Post, Body } from '@nestjs/common';
import { EmailQueueService } from './email-queue.service';
import { EmailOptions } from './interfaces/email.interface';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Controller('email')
export class EmailController {
  constructor(private readonly emailQueueService: EmailQueueService) {}

  @Post('send')
  async sendEmail(@Body() options: EmailOptions): Promise<ApiResponse> {
    try {
      await this.emailQueueService.addEmailJob(options);
      return {
        success: true,
        data: null,
        message: 'Email added to queue successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to add email to queue',
      };
    }
  }

  @Get('queue-stats')
  async getQueueStats(): Promise<ApiResponse> {
    try {
      const stats = await this.emailQueueService.getQueueStats();
      return {
        success: true,
        data: stats,
        message: 'Queue stats retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve queue stats',
      };
    }
  }
}
