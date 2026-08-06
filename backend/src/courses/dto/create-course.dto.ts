import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsHexColor, 
  MaxLength, 
  IsUUID,
  ValidatorConstraint, 
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions
} from 'class-validator';

// Heuristic #5: Error Prevention — validate course data before creation
// Heuristic #9: Help Users Recognize, Diagnose, and Recover from Errors — clear validation messages

@ValidatorConstraint({ name: 'isOptionalUUID', async: false })
export class IsOptionalUUIDConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    // If value is undefined, null, or empty string, it's valid (optional field)
    if (value === undefined || value === null || value === '') {
      return true;
    }
    // Otherwise, it must be a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return 'categoryId must be a valid UUID';
  }
}

export function IsOptionalUUID(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsOptionalUUIDConstraint,
    });
  };
}

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

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
