import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsArray,
} from 'class-validator';
import { QuestionType } from '@prisma/client';

export class CreateQuizQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  questionText: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  points?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @IsString()
  @IsOptional()
  correctAnswer?: string;
}
