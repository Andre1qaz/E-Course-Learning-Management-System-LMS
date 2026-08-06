import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsDateString, 
  IsArray, 
  ValidateNested,
  ValidatorConstraint, 
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions
} from 'class-validator';
import { Type } from 'class-transformer';

// Custom validator for optional UUID fields
@ValidatorConstraint({ name: 'isOptionalUUID', async: false })
export class IsOptionalUUIDConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return '${property} must be a valid UUID';
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

class AttachmentDto {
  @IsString()
  fileName: string;

  @IsString()
  fileUrl: string;

  @IsString()
  fileSize: string;
}

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsOptionalUUID()
  courseId?: string;
}
