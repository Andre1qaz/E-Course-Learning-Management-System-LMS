import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EmailType } from '../interfaces/email.interface';

// Heuristic #5: Error Prevention — validate email request payload

export class SendEmailDto {
  @IsEmail()
  @MaxLength(255)
  to!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;

  @IsEnum(EmailType)
  template!: EmailType;

  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>;
}
