import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsHexColor, 
  MaxLength
} from 'class-validator';

// Heuristic #5: Error Prevention — validate course data before creation
// Heuristic #9: Help Users Recognize, Diagnose, and Recover from Errors — clear validation messages

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  learningObjectives?: string;

  @IsHexColor()
  @IsOptional()
  thumbnailColor?: string;

  @IsOptional()
  isLinear?: boolean;

  @IsString()
  @IsOptional()
  categoryId?: string;
}