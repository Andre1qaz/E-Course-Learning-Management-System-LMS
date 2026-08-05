import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExportGradebookDto {
  @ApiProperty({ enum: ['excel', 'csv'], description: 'Export format' })
  @IsEnum(['excel', 'csv'])
  @IsNotEmpty()
  format: 'excel' | 'csv';
}

export class QueueExportDto extends ExportGradebookDto {
  @ApiProperty({ description: 'Course ID' })
  @IsNotEmpty()
  courseId: string;
}

export class JobStatusDto {
  @ApiProperty({ description: 'Job ID' })
  @IsNotEmpty()
  jobId: string;
}