/**
 * Base classes dan decorators untuk memudahkan pembuatan resource baru
 *
 * Export semua utilities yang diperlukan untuk pembuatan resource
 */

export { BaseService } from './base.service';
export {
  RequiredString,
  OptionalString,
  IdField,
  OptionalIdField,
  RequiredNumber,
  OptionalNumber,
  RequiredDate,
  OptionalDate,
  BooleanField,
  ColorField,
  DescriptionField,
  LearningObjectivesField,
  IsOptionalUUID,
} from './dto.decorators';
export { AutoValidator } from './validation-guide';
