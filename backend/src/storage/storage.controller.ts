import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import {
  GenerateUploadUrlDto,
  GenerateDownloadUrlDto,
  DeleteFileDto,
} from './dto/storage.dto';

// Heuristic #1: Visibility of System Status — clear API responses for upload operations
// Heuristic #5: Error Prevention — validate upload requests before processing

@ApiTags('Storage')
@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(
    private storageService: StorageService,
    private prisma: PrismaService,
  ) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate presigned URL for file upload' })
  async generateUploadUrl(@Body() dto: GenerateUploadUrlDto) {
    // Errors propagate to the global HttpExceptionFilter which returns
    // { success: false, ... } with the correct HTTP status code.
    const { uploadUrl, fileUrl } =
      await this.storageService.generateUploadUrl(
        dto.fileName,
        dto.fileType,
        dto.fileSize,
        dto.isPrivate || false,
      );

    return {
      success: true,
      data: { uploadUrl, fileUrl },
      message: 'Upload URL generated successfully',
    };
  }

  @Post('download-url')
  @ApiOperation({ summary: 'Generate presigned URL for private file download' })
  async generateDownloadUrl(
    @Body() dto: GenerateDownloadUrlDto,
    @CurrentUser('sub') userId: string,
  ) {
    // Only the owner of a private file may request a download URL
    const ownedFile = await this.prisma.privateFile.findFirst({
      where: { userId, fileUrl: dto.fileUrl },
    });

    if (!ownedFile) {
      throw new ForbiddenException(
        'You can only download your own private files',
      );
    }

    const key = this.storageService.extractKeyFromUrl(dto.fileUrl);
    const downloadUrl = await this.storageService.generateDownloadUrl(key);

    return {
      success: true,
      data: { downloadUrl },
      message: 'Download URL generated successfully',
    };
  }

  @Delete('file/:fileUrl')
  @ApiOperation({ summary: 'Delete file from storage' })
  @Roles(Role.ADMIN)
  async deleteFile(
    @Param('fileUrl') fileUrl: string,
    @Body() dto?: DeleteFileDto,
  ) {
    const key = this.storageService.extractKeyFromUrl(
      decodeURIComponent(fileUrl),
    );
    await this.storageService.deleteFile(key, dto?.isPrivate || false);

    return {
      success: true,
      data: null,
      message: 'File deleted successfully',
    };
  }
}
