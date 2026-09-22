import { IsOptional, IsString, MaxLength } from 'class-validator';

// Heuristic #5: Error Prevention — validate auto-save payload
// (replaces the previous untyped `dto: any` body)

export class AutoSaveAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  answer?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  essayAnswer?: string;
}
