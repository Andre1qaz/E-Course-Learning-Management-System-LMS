import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

// Custom validator for optional UUID fields
@ValidatorConstraint({ name: 'isOptionalUUID', async: false })
export class IsOptionalUUIDConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    // If value is undefined, null, or empty string, it's valid (optional field)
    if (value === undefined || value === null || value === '') {
      return true;
    }
    // Otherwise, it must be a valid UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return '${property} must be a valid UUID';
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
