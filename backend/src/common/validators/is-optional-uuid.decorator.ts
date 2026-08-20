import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { AutoValidator } from '../base/validation-guide';

// Custom validator for optional UUID fields
@ValidatorConstraint({ name: 'isOptionalUUID', async: false })
export class IsOptionalUUIDConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    // If value is undefined, null, or empty string, it's valid (optional field)
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
