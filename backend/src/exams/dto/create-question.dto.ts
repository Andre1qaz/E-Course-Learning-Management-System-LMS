import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MaxLength,
  IsEnum,
  IsArray,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { QuestionType } from '@prisma/client';

// Heuristic #5: Error Prevention — validate question data before creation
// Heuristic #16: Instructional Assessment — require correct answers for auto-grading

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  questionText: string;

  @IsEnum(QuestionType)
  @IsNotEmpty()
  type: QuestionType;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  points: number;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  explanation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  rubric?: string; // For Essay questions

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxChars?: number; // For short answer/essay

  @IsBoolean()
  @IsOptional()
  caseSensitive?: boolean; // For short answer

  @IsNumber()
  @IsOptional()
  @Min(0)
  tolerance?: number; // For short answer tolerance

  @IsBoolean()
  @IsOptional()
  allowMultiple?: boolean; // For MCQ multiple answers

  @IsArray()
  @IsOptional()
  options?: Array<{ text: string; isCorrect: boolean }>; // For MCQ questions

  @IsString()
  @IsOptional()
  correctAnswer?: string; // For True/False and Short Answer

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[]; // Question tags
}
