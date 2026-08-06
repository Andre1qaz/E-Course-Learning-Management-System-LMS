import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsDateString, 
  IsArray, 
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsOptionalUUID } from '../../common/validators/is-optional-uuid.decorator';

class AttachmentDto {
  @IsString()
  fileName!: string;

  @IsString()
  fileUrl!: string;

  @IsString()
  fileSize!: string;
}

export class CreateAnnouncementDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsOptionalUUID()
  courseId?: string;
}
