import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkUpdateGradeItemDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Assignment score (0-100)', required: false })
  @Type(() => Number)
  assignmentScore?: number;

  @ApiProperty({ description: 'Quiz score (0-100)', required: false })
  @Type(() => Number)
  quizScore?: number;

  @ApiProperty({ description: 'UTS score (0-100)', required: false })
  @Type(() => Number)
  utsScore?: number;

  @ApiProperty({ description: 'UAS score (0-100)', required: false })
  @Type(() => Number)
  uasScore?: number;

  @ApiProperty({ description: 'Other tasks score (0-100)', required: false })
  @Type(() => Number)
  otherScore?: number;
}

export class BulkUpdateGradesDto {
  @ApiProperty({ description: 'Array of grade updates', type: [BulkUpdateGradeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateGradeItemDto)
  grades: BulkUpdateGradeItemDto[];

  @ApiProperty({ description: 'Reason for bulk grade change', required: false })
  @IsString()
  changeReason?: string;
}
