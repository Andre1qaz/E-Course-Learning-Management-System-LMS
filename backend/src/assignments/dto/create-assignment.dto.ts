import { IsString, IsNotEmpty, IsOptional, IsNumber, MaxLength, IsDateString } from 'class-validator';

// Heuristic #5: Error Prevention — validate assignment data before creation
// Heuristic #16: Instructional Assessment — require maxScore for grading

export class CreateAssignmentDto {
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
  deadline!: string;

  @IsNumber()
  @IsNotEmpty()
  maxScore!: number;
}
