import { 
  IsString, 
  IsOptional, 
  IsDateString, 
  MaxLength, 
  IsEnum, 
  IsBoolean, 
  IsObject,
  ValidatorConstraint, 
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions
} from 'class-validator';
import { CalendarEventType, EventCategory, EventTargetAudience, RelatedActivityType } from '@prisma/client';

// Heuristic #5: Error Prevention — validate event data before update
// Heuristic #6: Recognition Rather Than Recall — clear event types

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

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  startTime?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  endTime?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  meetingLink?: string;

  @IsEnum(EventCategory)
  @IsOptional()
  category?: EventCategory;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  @IsEnum(CalendarEventType)
  @IsOptional()
  type?: CalendarEventType;

  @IsEnum(EventTargetAudience)
  @IsOptional()
  targetAudience?: EventTargetAudience;

  @IsEnum(RelatedActivityType)
  @IsOptional()
  relatedActivityType?: RelatedActivityType;

  @IsOptional()
  @IsOptionalUUID()
  relatedActivityId?: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsObject()
  @IsOptional()
  attachments?: any;
}
