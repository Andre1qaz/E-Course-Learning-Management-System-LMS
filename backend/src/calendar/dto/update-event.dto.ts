import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  IsEnum,
  IsBoolean,
  IsArray,
} from 'class-validator';
import {
  CalendarEventType,
  EventCategory,
  EventTargetAudience,
  RelatedActivityType,
} from '@prisma/client';
import { IsOptionalUUID } from '../../common/validators/is-optional-uuid.decorator';
import { CalendarEventAttachment } from './calendar.types';

// Heuristic #5: Error Prevention — validate event data before update
// Heuristic #6: Recognition Rather Than Recall — clear event types

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

  @IsArray()
  @IsOptional()
  attachments?: CalendarEventAttachment[];
}
