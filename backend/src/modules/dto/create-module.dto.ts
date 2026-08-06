import { IsString, IsNotEmpty, IsOptional, IsNumber, MaxLength, IsArray } from 'class-validator';

// Heuristic #5: Error Prevention — validate module data before creation
// Heuristic #12: Clarity of Purpose and Objectives — require learning objectives

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  learningObjectives?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class CreateModuleFileDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  fileType!: string;

  @IsNumber()
  @IsNotEmpty()
  fileSize!: number;

  @IsString()
  @IsNotEmpty()
  fileUrl!: string;
}
