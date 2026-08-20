import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsHexColor,
  MaxLength,
  Min,
  Max,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { AutoValidator } from './validation-guide';

/**
 * Custom decorators untuk DTO yang sering digunakan
 * Ini menyederhanakan pembuatan DTO dengan pattern yang konsisten
 * SEMUA ERROR MESSAGE DALAM BAHASA INDONESIA!
 */

// Custom validator untuk optional UUID dengan auto-format handling
@ValidatorConstraint({ name: 'isOptionalUUID', async: false })
export class IsOptionalUUIDConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (value === undefined || value === null || value === '') {
      return true;
    }

    return AutoValidator.isEntityId(String(value));
  }

  defaultMessage(args: ValidationArguments) {
    return '${property} harus berupa ID yang valid (CUID atau UUID)';
  }
}

export function IsOptionalUUID(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsOptionalUUIDConstraint,
    });
  };
}

// Custom validator untuk required UUID dengan auto-format handling
@ValidatorConstraint({ name: 'isUUID', async: false })
export class IsUUIDConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (value === undefined || value === null || value === '') {
      return false;
    }

    return AutoValidator.isEntityId(String(value));
  }

  defaultMessage(args: ValidationArguments) {
    return '${property} harus berupa ID yang valid (CUID atau UUID)';
  }
}

export function IsUUID(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUUIDConstraint,
    });
  };
}

/**
 * Decorator untuk string field yang required
 */
export function RequiredString(maxLength: number = 200) {
  return function (target: any, propertyKey: string) {
    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    MaxLength(maxLength)(target, propertyKey);
  };
}

/**
 * Decorator untuk optional string field
 */
export function OptionalString(maxLength: number = 200) {
  return function (target: any, propertyKey: string) {
    IsString()(target, propertyKey);
    IsOptional()(target, propertyKey);
    MaxLength(maxLength)(target, propertyKey);
  };
}

/**
 * Decorator untuk ID field (UUID)
 */
export function IdField() {
  return function (target: any, propertyKey: string) {
    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    IsOptionalUUID()(target, propertyKey);
  };
}

/**
 * Decorator untuk optional ID field
 */
export function OptionalIdField() {
  return function (target: any, propertyKey: string) {
    IsString()(target, propertyKey);
    IsOptional()(target, propertyKey);
    IsOptionalUUID()(target, propertyKey);
  };
}

/**
 * Decorator untuk number field yang required
 */
export function RequiredNumber(
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
) {
  return function (target: any, propertyKey: string) {
    IsNumber()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Min(min)(target, propertyKey);
    Max(max)(target, propertyKey);
  };
}

/**
 * Decorator untuk optional number field
 */
export function OptionalNumber(
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
) {
  return function (target: any, propertyKey: string) {
    IsNumber()(target, propertyKey);
    IsOptional()(target, propertyKey);
    Min(min)(target, propertyKey);
    Max(max)(target, propertyKey);
  };
}

/**
 * Decorator untuk date string field yang required
 */
export function RequiredDate() {
  return function (target: any, propertyKey: string) {
    IsDateString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
  };
}

/**
 * Decorator untuk optional date string field
 */
export function OptionalDate() {
  return function (target: any, propertyKey: string) {
    IsDateString()(target, propertyKey);
    IsOptional()(target, propertyKey);
  };
}

/**
 * Decorator untuk boolean field
 */
export function BooleanField() {
  return function (target: any, propertyKey: string) {
    IsBoolean()(target, propertyKey);
    IsOptional()(target, propertyKey);
  };
}

/**
 * Decorator untuk hex color field
 */
export function ColorField() {
  return function (target: any, propertyKey: string) {
    IsHexColor()(target, propertyKey);
    IsOptional()(target, propertyKey);
  };
}

/**
 * Decorator untuk description field (optional, long text)
 */
export function DescriptionField(maxLength: number = 2000) {
  return function (target: any, propertyKey: string) {
    IsString()(target, propertyKey);
    IsOptional()(target, propertyKey);
    MaxLength(maxLength)(target, propertyKey);
  };
}

/**
 * Decorator untuk learning objectives field (optional, very long text)
 */
export function LearningObjectivesField(maxLength: number = 5000) {
  return function (target: any, propertyKey: string) {
    IsString()(target, propertyKey);
    IsOptional()(target, propertyKey);
    MaxLength(maxLength)(target, propertyKey);
  };
}
