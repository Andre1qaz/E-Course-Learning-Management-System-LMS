import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from 'class-validator';

// Heuristic #5: Error Prevention — validate submission data

export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsOptional()
  answer?: string; // For MC and Short Answer

  @IsString()
  @IsOptional()
  essayAnswer?: string; // For Essay questions
}

export class SubmitExamDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[] = [];

  @IsBoolean()
  @IsOptional()
  autoSubmitted?: boolean;
}
