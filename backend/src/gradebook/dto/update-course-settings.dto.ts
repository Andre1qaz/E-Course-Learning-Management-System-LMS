import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCourseSettingsDto {
  @ApiPropertyOptional({ description: 'Passing grade (0-100)', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  passingGrade?: number;

  @ApiPropertyOptional({ description: 'Assignment weight (0-1)', default: 0.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  assignmentWeight?: number;

  @ApiPropertyOptional({ description: 'Quiz weight (0-1)', default: 0.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  quizWeight?: number;

  @ApiPropertyOptional({ description: 'UTS weight (0-1)', default: 0.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  utsWeight?: number;

  @ApiPropertyOptional({ description: 'UAS weight (0-1)', default: 0.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  uasWeight?: number;

  @ApiPropertyOptional({ description: 'Other tasks weight (0-1)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  otherWeight?: number;
}
