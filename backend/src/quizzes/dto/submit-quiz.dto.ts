import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

// Heuristic #5: Error Prevention — validate quiz submission payload

export class QuizAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  answerText?: string;

  @IsString()
  @IsOptional()
  selectedOptionId?: string;
}

export class SubmitQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];
}
