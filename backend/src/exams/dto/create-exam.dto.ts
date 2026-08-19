import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MaxLength,
  IsDateString,
  IsBoolean,
} from 'class-validator';

// Heuristic #5: Error Prevention — validate exam data before creation
// Heuristic #16: Instructional Assessment — require maxScore and duration

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @IsDateString()
  @IsNotEmpty()
  deadline!: string;

  @IsNumber()
  @IsNotEmpty()
  duration!: number; // in minutes

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
