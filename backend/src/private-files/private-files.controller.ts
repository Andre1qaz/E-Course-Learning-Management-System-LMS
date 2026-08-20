import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseEntityIdPipe } from '../common/pipes/parse-entity-id.pipe';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrivateFilesService } from './private-files.service';

// Heuristic #1: Visibility of System Status — clear API responses for file operations
// Heuristic #13: Storage Capability — quota tracking endpoints
// Heuristic #5: Error Prevention — validate file operations before execution

@ApiTags('Private Files')
@Controller('private-files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrivateFilesController {
  constructor(private privateFilesService: PrivateFilesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all private files for current user' })
  async getUserFiles(
    @CurrentUser('sub') userId: string,
    @Query('folderPath') folderPath?: string,
  ) {
    return this.privateFilesService.getUserFiles(userId, folderPath);
  }

  @Get('quota')
  @ApiOperation({ summary: 'Get user storage quota information' })
  async getUserQuota(@CurrentUser('sub') userId: string) {
    return this.privateFilesService.getUserQuota(userId);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a private file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileName: { type: 'string' },
        fileType: { type: 'string' },
        fileSize: { type: 'number' },
        folderPath: { type: 'string' },
      },
      required: ['fileName', 'fileType', 'fileSize'],
    },
  })
  async uploadFile(
    @CurrentUser('sub') userId: string,
    @Body()
    data: {
      fileName: string;
      fileType: string;
      fileSize: number;
      folderPath?: string;
    },
  ) {
    return this.privateFilesService.uploadFile(userId, data);
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Delete a private file' })
  async deleteFile(
    @CurrentUser('sub') userId: string,
    @Param('fileId', ParseEntityIdPipe) fileId: string,
  ) {
    return this.privateFilesService.deleteFile(userId, fileId);
  }

  @Post('folder')
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        folderPath: { type: 'string' },
      },
      required: ['folderPath'],
    },
  })
  async createFolder(
    @CurrentUser('sub') userId: string,
    @Body() data: { folderPath: string },
  ) {
    return this.privateFilesService.createFolder(userId, data.folderPath);
  }

  @Get(':fileId/download')
  @ApiOperation({ summary: 'Get download URL for a private file' })
  async getDownloadUrl(
    @CurrentUser('sub') userId: string,
    @Param('fileId', ParseEntityIdPipe) fileId: string,
  ) {
    return this.privateFilesService.getDownloadUrl(userId, fileId);
  }

  @Put(':fileId/rename')
  @ApiOperation({ summary: 'Rename a private file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newFileName: { type: 'string' },
      },
      required: ['newFileName'],
    },
  })
  async renameFile(
    @CurrentUser('sub') userId: string,
    @Param('fileId', ParseEntityIdPipe) fileId: string,
    @Body() data: { newFileName: string },
  ) {
    return this.privateFilesService.renameFile(
      userId,
      fileId,
      data.newFileName,
    );
  }

  @Put(':fileId/move')
  @ApiOperation({ summary: 'Move a file to a different folder' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newFolderPath: { type: 'string' },
      },
      required: ['newFolderPath'],
    },
  })
  async moveFile(
    @CurrentUser('sub') userId: string,
    @Param('fileId', ParseEntityIdPipe) fileId: string,
    @Body() data: { newFolderPath: string },
  ) {
    return this.privateFilesService.moveFile(
      userId,
      fileId,
      data.newFolderPath,
    );
  }
}
