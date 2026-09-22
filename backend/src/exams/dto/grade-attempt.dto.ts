import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// Heuristic #5: Error Prevention — validate manual grading payload

export class ManualGradeAnswerDto {
  @IsString()
  questionId: string;

  @IsNumber()
  @Min(0)
  @Max(1000)
  score: number;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  feedback?: string;
}

export class GradeAttemptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualGradeAnswerDto)
  answers: ManualGradeAnswerDto[];
}
