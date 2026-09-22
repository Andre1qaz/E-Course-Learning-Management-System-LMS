import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Heuristic #5: Error Prevention — validate storage request payloads

export class GenerateUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(127)
  fileType!: string;

  @IsNumber()
  @Min(1)
  @Max(500 * 1024 * 1024) // 500 MB hard cap
  fileSize!: number;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}

export class GenerateDownloadUrlDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  fileUrl!: string;
}

export class DeleteFileDto {
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
