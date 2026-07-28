import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGradeDto {
  @ApiPropertyOptional({ description: 'Assignment score (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  assignmentScore?: number;

  @ApiPropertyOptional({ description: 'Quiz score (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  quizScore?: number;

  @ApiPropertyOptional({ description: 'UTS score (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  utsScore?: number;

  @ApiPropertyOptional({ description: 'UAS score (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  uasScore?: number;

  @ApiPropertyOptional({ description: 'Other tasks score (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  otherScore?: number;

  @ApiPropertyOptional({ description: 'Reason for grade change' })
  @IsOptional()
  @IsString()
  changeReason?: string;
}
