import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AutoValidator } from '../common/base/validation-guide';

// Heuristic #1: Visibility of System Status — clear error messages for upload failures
// Heuristic #5: Error Prevention — validate file types and sizes before upload

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private publicBucket: string;
  private privateBucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    try {
      // Check for R2 configuration (production)
      const r2Endpoint = this.configService.get('R2_ENDPOINT');
      const r2AccessKey = this.configService.get('R2_ACCESS_KEY_ID');
      const r2SecretKey = this.configService.get('R2_SECRET_ACCESS_KEY');
      const r2AccountId = this.configService.get('R2_ACCOUNT_ID');

      // Check for MinIO configuration (development)
      const minioEndpoint = this.configService.get('MINIO_ENDPOINT') || 'localhost';
      const minioPort = this.configService.get('MINIO_PORT') || '9000';
      const minioAccessKey = this.configService.get('MINIO_ACCESS_KEY') || 'minioadmin';
      const minioSecretKey = this.configService.get('MINIO_SECRET_KEY') || 'minioadmin123';

      // Use R2 if configured, otherwise fall back to MinIO
      if (r2Endpoint && r2AccessKey && r2SecretKey) {
        this.logger.log('Using Cloudflare R2 Configuration:', {
          endpoint: r2Endpoint,
          accountId: r2AccountId,
          hasAccessKey: !!r2AccessKey,
        });

        this.s3Client = new S3Client({
          endpoint: r2Endpoint,
          region: 'auto',
          credentials: {
            accessKeyId: r2AccessKey,
            secretAccessKey: r2SecretKey,
          },
        });

        this.publicBucket = this.configService.get('R2_BUCKET_PUBLIC') || 'ecourse-public';
        this.privateBucket = this.configService.get('R2_BUCKET_PRIVATE') || 'ecourse-private';
      } else {
        this.logger.log('Using MinIO Configuration:', {
          endpoint: minioEndpoint,
          port: minioPort,
          hasAccessKey: !!minioAccessKey,
          hasSecretKey: !!minioSecretKey,
        });

        this.s3Client = new S3Client({
          endpoint: `http://${minioEndpoint}:${minioPort}`,
          region: 'us-east-1',
          credentials: {
            accessKeyId: minioAccessKey,
            secretAccessKey: minioSecretKey,
          },
          forcePathStyle: true,
        });

        this.publicBucket = this.configService.get('MINIO_BUCKET_PUBLIC') || 'ecourse-public';
        this.privateBucket = this.configService.get('MINIO_BUCKET_PRIVATE') || 'ecourse-private';
      }

      this.logger.log('StorageService initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize StorageService:', error);
      throw error;
    }
  }

  resolveFileType(fileType: string, fileName: string): string {
    const trimmed = (fileType || '').trim().toLowerCase();
    if (trimmed && trimmed !== 'application/octet-stream') {
      return trimmed;
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const byExtension: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      mp4: 'video/mp4',
      webm: 'video/webm',
      zip: 'application/zip',
      txt: 'text/plain',
    };

    return byExtension[ext] || trimmed || 'application/octet-stream';
  }

  /**
   * Generate presigned URL for file upload
   * Heuristic #5: Error Prevention — validate file type before generating URL
   */
  async generateUploadUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
    isPrivate: boolean = false,
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    try {
      const resolvedType = this.resolveFileType(fileType, fileName);

      const result = AutoValidator.validateObject(
        {
          fileName,
          fileType: resolvedType,
          fileSize,
          isPrivate,
        },
        {
          fileName: { type: 'string', required: true, maxLength: 255 },
          fileType: { type: 'string', required: true, maxLength: 100 },
          fileSize: {
            type: 'number',
            required: true,
            min: 0,
            max: 50 * 1024 * 1024,
          },
          isPrivate: { type: 'boolean', required: false },
        },
      );

      if (!result.valid) {
        throw new BadRequestException(
          `Validasi gagal: ${result.errors.join(', ')}`,
        );
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/webm',
        'application/zip',
        'text/plain',
        'application/octet-stream',
      ];

      if (!allowedTypes.includes(String(result.sanitized.fileType))) {
        throw new BadRequestException(
          `Tipe file ${result.sanitized.fileType} tidak diizinkan. Tipe yang diizinkan: PDF, Word, PowerPoint, JPEG, PNG, GIF, MP4, WebM, ZIP, TXT`,
        );
      }

      const bucket = result.sanitized.isPrivate
        ? this.privateBucket
        : this.publicBucket;
      const safeFileName = String(result.sanitized.fileName)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 180);
      const key = `${Date.now()}-${safeFileName}`;

      // Do not sign ContentLength: browser PUT headers can mismatch and fail the upload.
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: String(result.sanitized.fileType),
      });

      try {
        const uploadUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: 3600,
        });
        const fileUrl = this.buildPublicFileUrl(bucket, key);
        return { uploadUrl, fileUrl };
      } catch (signingError) {
        throw new BadRequestException(
          `Gagal membuat signed URL: ${signingError instanceof Error ? signingError.message : 'Unknown error'}. Pastikan MinIO server berjalan dan credentials benar.`,
        );
      }
    } catch (error) {
      this.logger.error('Error generating upload URL:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Gagal membuat URL upload. Pastikan MinIO server berjalan dengan benar.',
      );
    }
  }

  /**
   * Generate presigned URL for file download (private files)
   */
  async generateDownloadUrl(key: string): Promise<string> {
    // ✅ Validate key dengan AutoValidator
    const validatedKey = AutoValidator.validateString(key, 'File key', 500);

    const command = new GetObjectCommand({
      Bucket: this.privateBucket,
      Key: validatedKey,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
  }

  /**
   * Delete file from storage
   */
  async deleteFile(key: string, isPrivate: boolean = false): Promise<void> {
    // ✅ Validate input dengan AutoValidator
    const validatedKey = AutoValidator.validateString(key, 'File key', 500);
    const validatedIsPrivate =
      AutoValidator.validateOptionalBoolean(isPrivate, 'Is private') ?? false;

    const bucket = validatedIsPrivate ? this.privateBucket : this.publicBucket;
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: validatedKey,
    });

    await this.s3Client.send(command);
  }

  private buildPublicFileUrl(bucket: string, key: string): string {
    // Check if using R2 (production)
    const r2Endpoint = this.configService.get('R2_ENDPOINT');
    if (r2Endpoint) {
      // R2 public URL format
      return `${r2Endpoint}/${bucket}/${key}`;
    }

    // Fall back to MinIO (development)
    const rawEndpoint =
      this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
    const port = this.configService.get<string>('MINIO_PORT') || '9000';
    const useSsl =
      String(this.configService.get('MINIO_USE_SSL') || 'false') === 'true' ||
      rawEndpoint.startsWith('https://');
    const host = rawEndpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const protocol = useSsl ? 'https' : 'http';

    return `${protocol}://${host}:${port}/${bucket}/${key}`;
  }

  /**
   * Extract key from file URL
   */
  extractKeyFromUrl(fileUrl: string): string {
    // ✅ Validate fileUrl dengan AutoValidator
    const validatedFileUrl = AutoValidator.validateString(
      fileUrl,
      'File URL',
      1000,
    );
    const parts = validatedFileUrl.split('/');
    return parts[parts.length - 1];
  }
}
