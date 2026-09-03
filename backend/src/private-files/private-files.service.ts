import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrivateFile } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AutoValidator } from '../common/base/validation-guide';

const FOLDER_MIME = 'application/x-folder';

type SerializedPrivateFile = Omit<PrivateFile, 'fileSize'> & {
  fileSize: number;
};

@Injectable()
export class PrivateFilesService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async getUserFiles(userId: string, folderPath = '/') {
    const currentPath = this.normalizeFolderPath(folderPath);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        storageQuotaUsed: true,
        storageQuotaLimit: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const records = await this.prisma.privateFile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const files = records
      .filter(
        (file) => file.folderPath === currentPath && !this.isFolderRecord(file),
      )
      .map((file) => this.serializeFile(file));

    const folders = records
      .filter(
        (file) =>
          this.isFolderRecord(file) &&
          this.parentPath(file.folderPath) === currentPath,
      )
      .map((file) => ({
        ...this.serializeFile(file),
        fileName: this.folderDisplayName(file.folderPath),
        mimeType: FOLDER_MIME,
      }));

    return {
      success: true,
      data: {
        files: [...folders, ...files],
        quota: {
          used: Number(user.storageQuotaUsed || 0),
          limit: Number(user.storageQuotaLimit || 52428800),
        },
      },
      message: 'Private files retrieved successfully',
    };
  }

  async getUserQuota(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        storageQuotaUsed: true,
        storageQuotaLimit: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
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

  async uploadFile(
    userId: string,
    data: {
      fileName: string;
      fileType: string;
      fileSize: number;
      folderPath?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        storageQuotaUsed: true,
        storageQuotaLimit: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const newQuotaUsed = Number(user.storageQuotaUsed) + data.fileSize;
    if (newQuotaUsed > Number(user.storageQuotaLimit)) {
      const remaining =
        Number(user.storageQuotaLimit) - Number(user.storageQuotaUsed);
      throw new ForbiddenException(
        `Kuota penyimpanan penuh. Ukuran maksimal untuk file baru: ${(remaining / 1024 / 1024).toFixed(2)}MB, batas total: ${(Number(user.storageQuotaLimit) / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    const fileType = this.storageService.resolveFileType(
      data.fileType,
      data.fileName,
    );

    const { uploadUrl, fileUrl } = await this.storageService.generateUploadUrl(
      data.fileName,
      fileType,
      data.fileSize,
      true,
    );

    const file = await this.prisma.privateFile.create({
      data: {
        userId,
        fileName: data.fileName,
        fileUrl,
        fileSize: BigInt(data.fileSize),
        folderPath: this.normalizeFolderPath(data.folderPath || '/'),
        mimeType: fileType,
      },
    });

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
        file: this.serializeFile(file),
      },
      message: 'URL upload berhasil dibuat',
    };
  }

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

    const targets = this.isFolderRecord(file)
      ? await this.prisma.privateFile.findMany({
          where: {
            userId,
            OR: [
              { id: file.id },
              { folderPath: file.folderPath },
              {
                folderPath: {
                  startsWith:
                    file.folderPath === '/' ? '/' : `${file.folderPath}/`,
                },
              },
            ],
          },
        })
      : [file];

    let freed = 0;
    for (const target of targets) {
      if (target.fileUrl) {
        const key = this.storageService.extractKeyFromUrl(target.fileUrl);
        await this.storageService.deleteFile(key, true);
      }
      freed += Number(target.fileSize);
    }

    await this.prisma.privateFile.deleteMany({
      where: { id: { in: targets.map((target) => target.id) } },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { storageQuotaUsed: true },
    });

    if (user) {
      const newQuotaUsed = Number(user.storageQuotaUsed) - freed;
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          storageQuotaUsed: BigInt(Math.max(0, newQuotaUsed)),
        },
      });
    }

    return {
      success: true,
      data: null,
      message: 'File deleted successfully',
    };
  }

  async createFolder(userId: string, folderPath: string) {
    const result = AutoValidator.validateObject(
      { folderPath },
      {
        folderPath: { type: 'string', required: true, maxLength: 500 },
      },
    );

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    const normalizedPath = this.normalizeFolderPath(
      String(result.sanitized.folderPath),
    );

    const existingFolder = await this.prisma.privateFile.findFirst({
      where: {
        userId,
        folderPath: normalizedPath,
        mimeType: FOLDER_MIME,
      },
    });

    if (existingFolder) {
      throw new ForbiddenException('Folder already exists');
    }

    await this.prisma.privateFile.create({
      data: {
        userId,
        fileName: this.folderDisplayName(normalizedPath),
        fileUrl: '',
        fileSize: BigInt(0),
        folderPath: normalizedPath,
        mimeType: FOLDER_MIME,
      },
    });

    return {
      success: true,
      data: { folderPath: normalizedPath },
      message: 'Folder created successfully',
    };
  }

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

    if (this.isFolderRecord(file) || !file.fileUrl) {
      throw new BadRequestException('Folder tidak dapat diunduh');
    }

    const key = this.storageService.extractKeyFromUrl(file.fileUrl);
    const downloadUrl = await this.storageService.generateDownloadUrl(key);

    return {
      success: true,
      data: { downloadUrl, fileName: file.fileName },
      message: 'Download URL generated successfully',
    };
  }

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

    if (this.isFolderRecord(file)) {
      throw new BadRequestException('Gunakan nama folder saat membuat folder');
    }

    const updatedFile = await this.prisma.privateFile.update({
      where: { id: fileId },
      data: { fileName: newFileName },
    });

    return {
      success: true,
      data: this.serializeFile(updatedFile),
      message: 'File renamed successfully',
    };
  }

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

    const updatedFile = await this.prisma.privateFile.update({
      where: { id: fileId },
      data: { folderPath: this.normalizeFolderPath(newFolderPath) },
    });

    return {
      success: true,
      data: this.serializeFile(updatedFile),
      message: 'File moved successfully',
    };
  }

  private serializeFile(file: PrivateFile): SerializedPrivateFile {
    return {
      ...file,
      fileSize: Number(file.fileSize),
    };
  }

  private isFolderRecord(file: Pick<PrivateFile, 'mimeType' | 'fileName'>) {
    return file.mimeType === FOLDER_MIME || file.fileName === '.folder';
  }

  private normalizeFolderPath(folderPath: string) {
    const trimmed = folderPath.trim() || '/';
    const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const collapsed = withSlash.replace(/\/+/g, '/');
    if (collapsed.length > 1 && collapsed.endsWith('/')) {
      return collapsed.slice(0, -1);
    }
    return collapsed || '/';
  }

  private folderDisplayName(folderPath: string) {
    const parts = folderPath.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'Folder';
  }

  private parentPath(folderPath: string) {
    if (folderPath === '/') {
      return '/';
    }
    const parts = folderPath.split('/').filter(Boolean);
    parts.pop();
    return parts.length > 0 ? `/${parts.join('/')}` : '/';
  }
}
