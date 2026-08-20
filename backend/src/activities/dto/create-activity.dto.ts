import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsObject,
  IsDateString,
} from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @IsEnum(ActivityType)
  type: ActivityType;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['DRAFT', 'PUBLISHED'])
  @IsOptional()
  status?: 'DRAFT' | 'PUBLISHED';

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsObject()
  @IsOptional()
  metadata?: any;

  @IsDateString()
  @IsOptional()
  publishedAt?: string;
}
