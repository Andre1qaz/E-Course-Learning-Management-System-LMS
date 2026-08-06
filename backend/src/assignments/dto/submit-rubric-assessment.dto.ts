import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

// Heuristic #16: Instructional Assessment — detailed rubric assessment

class RubricCriterionAssessmentDto {
  @IsString()
  rubricCriterionId!: string;

  @IsString()
  @IsOptional()
  rubricCriterionLevelId?: string;

  @IsNumber()
  @Min(0)
  score!: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  feedback?: string;
}

export class SubmitRubricAssessmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricCriterionAssessmentDto)
  assessments!: RubricCriterionAssessmentDto[];
}
