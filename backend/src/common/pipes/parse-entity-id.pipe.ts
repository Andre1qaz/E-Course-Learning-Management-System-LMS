import { Injectable, PipeTransform } from '@nestjs/common';
import { AutoValidator } from '../base/validation-guide';

/** Accepts Prisma CUID and UUID (with or without dashes). */
@Injectable()
export class ParseEntityIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    return AutoValidator.validateUUID(value, 'ID');
  }
}
