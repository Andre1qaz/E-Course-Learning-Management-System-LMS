import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from './storage.service';

// Heuristic #1: Visibility of System Status — clear API responses for upload operations
// Heuristic #5: Error Prevention — validate upload requests before processing

@ApiTags('Storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate presigned URL for file upload' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileName: { type: 'string' },
        fileType: { type: 'string' },
        fileSize: { type: 'number' },
        isPrivate: { type: 'boolean' },
      },
      required: ['fileName', 'fileType', 'fileSize'],
    },
  })
  async generateUploadUrl(
    @Body()
    body: {
      fileName: string;
      fileType: string;
      fileSize: number;
      isPrivate?: boolean;
    },
  ) {
    try {
      const { uploadUrl, fileUrl } =
        await this.storageService.generateUploadUrl(
          body.fileName,
          body.fileType,
          body.fileSize,
          body.isPrivate || false,
        );

      return {
        success: true,
        data: { uploadUrl, fileUrl },
        message: 'Upload URL generated successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: (error as Error).message || 'Failed to generate upload URL',
      };
    }
  }

  @Post('download-url')
  @ApiOperation({ summary: 'Generate presigned URL for private file download' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileUrl: { type: 'string' },
      },
      required: ['fileUrl'],
    },
  })
  async generateDownloadUrl(@Body() body: { fileUrl: string }) {
    try {
      const key = this.storageService.extractKeyFromUrl(body.fileUrl);
      const downloadUrl = await this.storageService.generateDownloadUrl(key);

      return {
        success: true,
        data: { downloadUrl },
        message: 'Download URL generated successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: (error as Error).message || 'Failed to generate download URL',
      };
    }
  }

  @Delete('file/:fileUrl')
  @ApiOperation({ summary: 'Delete file from storage' })
  async deleteFile(
    @Param('fileUrl') fileUrl: string,
    @Body() body: { isPrivate?: boolean },
  ) {
    try {
      const key = this.storageService.extractKeyFromUrl(
        decodeURIComponent(fileUrl),
      );
      await this.storageService.deleteFile(key, body.isPrivate || false);

      return {
        success: true,
        data: null,
        message: 'File deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: (error as Error).message || 'Failed to delete file',
      };
    }
  }
}
