import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsHexColor, 
  MaxLength, 
  IsUUID
} from 'class-validator';
import { IsOptionalUUID } from '../../common/validators/is-optional-uuid.decorator';

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

  @IsOptional()
  @IsOptionalUUID()
  categoryId?: string;
}
