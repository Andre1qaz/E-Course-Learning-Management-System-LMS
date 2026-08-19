import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// Heuristic #16: Instructional Assessment — structured rubric creation

class RubricCriterionLevelDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(500)
  description!: string;

  @IsNumber()
  @Min(0)
  points!: number;

  @IsNumber()
  @Min(0)
  order!: number;
}

class RubricCriterionDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(0)
  maxPoints!: number;

  @IsNumber()
  @Min(0)
  order!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricCriterionLevelDto)
  levels!: RubricCriterionLevelDto[];
}

export class CreateRubricDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsNumber()
  @Min(0)
  totalPoints!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricCriterionDto)
  criteria!: RubricCriterionDto[];
}
