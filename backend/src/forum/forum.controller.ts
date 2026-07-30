import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ForumService } from './forum.service';

// Heuristic #1: Visibility of System Status — clear API responses for forum operations
// Heuristic #5: Error Prevention — validate thread/reply data before processing
// Heuristic #18: Collaborative Learning — support threaded discussions

@ApiTags('Forum')
@Controller('forum')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ForumController {
  constructor(private forumService: ForumService) {}

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all forum threads for a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  async getCourseThreads(@Param('courseId') courseId: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: Role) {
    return this.forumService.getCourseThreads(courseId, userId, role);
  }

  @Get('thread/:threadId')
  @ApiOperation({ summary: 'Get a single forum thread with replies' })
  @ApiParam({ name: 'threadId', description: 'Thread ID' })
  async getThread(
    @Param('threadId') threadId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.forumService.getThread(threadId, userId, role);
  }

  @Post('thread')
  @ApiOperation({ summary: 'Create a new forum thread' })
  async createThread(
    @CurrentUser('sub') userId: string,
    @Body() data: { courseId: string; title: string; content: string; attachments?: Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }> },
  ) {
    return this.forumService.createThread(userId, data.courseId, {
      title: data.title,
      content: data.content,
      attachments: data.attachments,
    });
  }

  @Put('thread/:threadId')
  @ApiOperation({ summary: 'Update a forum thread' })
  @ApiParam({ name: 'threadId', description: 'Thread ID' })
  async updateThread(
    @CurrentUser('sub') userId: string,
    @Param('threadId') threadId: string,
    @Body() data: { title?: string; content?: string },
  ) {
    return this.forumService.updateThread(userId, threadId, data);
  }

  @Delete('thread/:threadId')
  @ApiOperation({ summary: 'Delete a forum thread' })
  @ApiParam({ name: 'threadId', description: 'Thread ID' })
  async deleteThread(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('threadId') threadId: string,
  ) {
    return this.forumService.deleteThread(userId, role, threadId);
  }

  @Put('thread/:threadId/pin')
  @ApiOperation({ summary: 'Pin/unpin a thread (instructor only)' })
  @ApiParam({ name: 'threadId', description: 'Thread ID' })
  async togglePinThread(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('threadId') threadId: string,
  ) {
    return this.forumService.togglePinThread(userId, role, threadId);
  }

  @Put('thread/:threadId/lock')
  @ApiOperation({ summary: 'Lock/unlock a thread (instructor/admin only)' })
  @ApiParam({ name: 'threadId', description: 'Thread ID' })
  async toggleLockThread(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('threadId') threadId: string,
  ) {
    return this.forumService.toggleLockThread(userId, role, threadId);
  }

  @Put('thread/:threadId/best-answer/:replyId')
  @ApiOperation({ summary: 'Mark a reply as best answer (instructor/admin only)' })
  @ApiParam({ name: 'threadId', description: 'Thread ID' })
  @ApiParam({ name: 'replyId', description: 'Reply ID' })
  async markBestAnswer(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('threadId') threadId: string,
    @Param('replyId') replyId: string,
  ) {
    return this.forumService.markBestAnswer(userId, role, threadId, replyId);
  }

  @Delete('thread/:threadId/best-answer')
  @ApiOperation({ summary: 'Remove best answer (instructor/admin only)' })
  @ApiParam({ name: 'threadId', description: 'Thread ID' })
  async removeBestAnswer(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('threadId') threadId: string,
  ) {
    return this.forumService.removeBestAnswer(userId, role, threadId);
  }

  @Post('thread/:threadId/reply')
  @ApiOperation({ summary: 'Add a reply to a thread' })
  @ApiParam({ name: 'threadId', description: 'Thread ID' })
  async createReply(
    @CurrentUser('sub') userId: string,
    @Param('threadId') threadId: string,
    @Body() data: { content: string; attachments?: Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }> },
  ) {
    return this.forumService.createReply(userId, threadId, data);
  }

  @Put('reply/:replyId')
  @ApiOperation({ summary: 'Update a reply' })
  @ApiParam({ name: 'replyId', description: 'Reply ID' })
  async updateReply(
    @CurrentUser('sub') userId: string,
    @Param('replyId') replyId: string,
    @Body() data: { content: string },
  ) {
    return this.forumService.updateReply(userId, replyId, data.content);
  }

  @Delete('reply/:replyId')
  @ApiOperation({ summary: 'Delete a reply' })
  @ApiParam({ name: 'replyId', description: 'Reply ID' })
  async deleteReply(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('replyId') replyId: string,
  ) {
    return this.forumService.deleteReply(userId, role, replyId);
  }

  @Post('attachment/upload-url')
  @ApiOperation({ summary: 'Generate upload URL for forum attachment' })
  async generateAttachmentUploadUrl(
    @CurrentUser('sub') userId: string,
    @Body() data: { fileName: string; fileType: string; fileSize: number },
  ) {
    return this.forumService.generateAttachmentUploadUrl(userId, data.fileName, data.fileType, data.fileSize);
  }
}
