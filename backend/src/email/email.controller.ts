import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EmailQueueService } from './email-queue.service';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { SendEmailDto } from './dto/send-email.dto';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailQueueService: EmailQueueService) {}

  @Post('send')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Queue an email for sending (Admin only)' })
  async sendEmail(@Body() dto: SendEmailDto): Promise<ApiResponse> {
    // Errors propagate to the global HttpExceptionFilter which returns
    // { success: false, ... } with the correct HTTP status code.
    await this.emailQueueService.addEmailJob({
      to: dto.to,
      subject: dto.subject,
      template: dto.template,
      context: dto.context,
    });
    return {
      success: true,
      data: null,
      message: 'Email added to queue successfully',
    };
  }

  @Get('queue-stats')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get email queue statistics (Admin only)' })
  async getQueueStats(): Promise<ApiResponse> {
    const stats = await this.emailQueueService.getQueueStats();
    return {
      success: true,
      data: stats,
      message: 'Queue stats retrieved successfully',
    };
  }
}
