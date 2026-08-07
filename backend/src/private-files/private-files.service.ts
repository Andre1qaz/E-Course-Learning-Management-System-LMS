import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AutoValidator } from '../common/base/validation-guide';

// Heuristic #1: Visibility of System Status — clear file operation responses
// Heuristic #13: Storage Capability — quota tracking and visual indicators
// Heuristic #5: Error Prevention — validate file operations before execution

@Injectable()
export class PrivateFilesService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /**
   * Get all private files for a user
   */
  async getUserFiles(userId: string, folderPath = '/') {
    const files = await this.prisma.privateFile.findMany({
      where: {
        userId,
        folderPath,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user's current quota usage
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        storageQuotaUsed: true,
        storageQuotaLimit: true,
      },
    });

    return {
      success: true,
      data: {
        files,
        quota: {
          used: Number(user?.storageQuotaUsed || 0),
          limit: Number(user?.storageQuotaLimit || 52428800), // 50MB default
        },
      },
      message: 'Private files retrieved successfully',
    };
  }

  /**
   * Get user's quota information
   */
  async getUserQuota(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        storageQuotaUsed: true,
        storageQuotaLimit: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: {
        used: Number(user.storageQuotaUsed),
        limit: Number(user.storageQuotaLimit),
      },
      message: 'Quota information retrieved successfully',
    };
  }

  /**
   * Upload a private file
   */
  async uploadFile(
    userId: string,
    data: {
      fileName: string;
      fileType: string;
      fileSize: number;
      folderPath?: string;
    },
  ) {
    // Check user's quota
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        storageQuotaUsed: true,
        storageQuotaLimit: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newQuotaUsed = Number(user.storageQuotaUsed) + data.fileSize;
    if (newQuotaUsed > Number(user.storageQuotaLimit)) {
      const remaining = Number(user.storageQuotaLimit) - Number(user.storageQuotaUsed);
      throw new ForbiddenException(
        `Storage quota exceeded. Maximum size for new files: ${(remaining / 1024 / 1024).toFixed(2)}MB, overall limit: ${(Number(user.storageQuotaLimit) / 1024 / 1024).toFixed(2)}MB`
      );
    }

    // Generate presigned URL for upload
    const { uploadUrl, fileUrl } = await this.storageService.generateUploadUrl(
      data.fileName,
      data.fileType,
      data.fileSize,
      true, // isPrivate
    );

    // Create file record in database
    const file = await this.prisma.privateFile.create({
      data: {
        userId,
        fileName: data.fileName,
        fileUrl,
        fileSize: BigInt(data.fileSize),
        folderPath: data.folderPath || '/',
        mimeType: data.fileType,
      },
    });

    // Update user's quota
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        storageQuotaUsed: BigInt(newQuotaUsed),
      },
    });

    return {
      success: true,
      data: {
        uploadUrl,
        fileUrl,
        file,
      },
      message: 'File upload URL generated successfully',
    };
  }

  /**
   * Delete a private file
   */
  async deleteFile(userId: string, fileId: string) {
    const file = await this.prisma.privateFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.userId !== userId) {
      throw new ForbiddenException('You can only delete your own files');
    }

    // Delete from storage
    const key = this.storageService.extractKeyFromUrl(file.fileUrl);
    await this.storageService.deleteFile(key, true);

    // Update user's quota
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { storageQuotaUsed: true },
    });

    if (user) {
      const newQuotaUsed = Number(user.storageQuotaUsed) - Number(file.fileSize);
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          storageQuotaUsed: BigInt(Math.max(0, newQuotaUsed)),
        },
      });
    }

    // Delete file record
    await this.prisma.privateFile.delete({
      where: { id: fileId },
    });

    return {
      success: true,
      data: null,
      message: 'File deleted successfully',
    };
  }

  /**
   * Create a folder (virtual - just a path marker)
   * ✅ MENGGUNAKAN AutoValidator untuk otomatis format handling
   */
  async createFolder(userId: string, folderPath: string) {
    // ✅ Auto-validation folderPath
    const result = AutoValidator.validateObject({ folderPath }, {
      folderPath: { type: 'string', required: true, maxLength: 500 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // Normalize folder path
    const normalizedPath = result.sanitized.folderPath.startsWith('/') 
      ? result.sanitized.folderPath 
      : `/${result.sanitized.folderPath}`;
    
    // Check if folder already exists (by checking if any file exists in this path)
    const existingFile = await this.prisma.privateFile.findFirst({
      where: {
        userId,
        folderPath: normalizedPath,
      },
    });

    if (existingFile) {
      throw new ForbiddenException('Folder already exists');
    }

    // Create a placeholder file to mark the folder
    await this.prisma.privateFile.create({
      data: {
        userId,
        fileName: '.folder',
        fileUrl: '',
        fileSize: BigInt(0),
        folderPath: normalizedPath,
        mimeType: 'application/x-folder',
      },
    });

    return {
      success: true,
      data: { folderPath: normalizedPath },
      message: 'Folder created successfully',
    };
  }

  /**
   * Get download URL for a private file
   */
  async getDownloadUrl(userId: string, fileId: string) {
    const file = await this.prisma.privateFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.userId !== userId) {
      throw new ForbiddenException('You can only download your own files');
    }

    const key = this.storageService.extractKeyFromUrl(file.fileUrl);
    const downloadUrl = await this.storageService.generateDownloadUrl(key);

    return {
      success: true,
      data: { downloadUrl, fileName: file.fileName },
      message: 'Download URL generated successfully',
    };
  }

  /**
   * Rename a file
   */
  async renameFile(userId: string, fileId: string, newFileName: string) {
    const file = await this.prisma.privateFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.userId !== userId) {
      throw new ForbiddenException('You can only rename your own files');
    }

    const updatedFile = await this.prisma.privateFile.update({
      where: { id: fileId },
      data: { fileName: newFileName },
    });

    return {
      success: true,
      data: updatedFile,
      message: 'File renamed successfully',
    };
  }

  /**
   * Move a file to a different folder
   */
  async moveFile(userId: string, fileId: string, newFolderPath: string) {
    const file = await this.prisma.privateFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.userId !== userId) {
      throw new ForbiddenException('You can only move your own files');
    }

    const normalizedPath = newFolderPath.startsWith('/') ? newFolderPath : `/${newFolderPath}`;

    const updatedFile = await this.prisma.privateFile.update({
      where: { id: fileId },
      data: { folderPath: normalizedPath },
    });

    return {
      success: true,
      data: updatedFile,
      message: 'File moved successfully',
    };
  }
}
