import { Injectable, BadRequestException } from '@nestjs/common';
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

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get('MINIO_ENDPOINT') || 'localhost';
    const port = this.configService.get('MINIO_PORT') || '9000';
    const accessKey = this.configService.get('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get('MINIO_SECRET_KEY');

    if (!accessKey || !secretKey) {
      throw new Error('MinIO credentials are not configured');
    }

    this.s3Client = new S3Client({
      endpoint: `http://${endpoint}:${port}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    });

    this.publicBucket =
      this.configService.get('MINIO_BUCKET_PUBLIC') || 'ecourse-public';
    this.privateBucket =
      this.configService.get('MINIO_BUCKET_PRIVATE') || 'ecourse-private';
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
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(
      {
        fileName,
        fileType,
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
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate file type (whitelist approach)
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
    ];

    if (!allowedTypes.includes(result.sanitized.fileType)) {
      throw new BadRequestException(
        `File type ${result.sanitized.fileType} is not allowed`,
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
      ContentType: result.sanitized.fileType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    }); // 1 hour
    const fileUrl = this.buildPublicFileUrl(bucket, key);

    return { uploadUrl, fileUrl };
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
