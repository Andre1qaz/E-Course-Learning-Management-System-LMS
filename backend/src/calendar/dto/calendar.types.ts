import {
  EventCategory,
  EventTargetAudience,
  RelatedActivityType,
  CalendarEventType,
} from '@prisma/client';

export interface CalendarEventWhere {
  isPublished?: boolean;
  OR?: Array<{
    courseId?: { in: string[] };
    targetAudience?: EventTargetAudience;
    userId?: string;
  }>;
  courseId?: string;
  category?: EventCategory;
  startDate?: { gte?: Date; lte?: Date };
  userId?: string;
}

export interface CalendarEventAttachment {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface CreateCalendarEventDto {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  category?: EventCategory;
  color?: string;
  type?: CalendarEventType;
  targetAudience?: EventTargetAudience;
  relatedActivityType?: RelatedActivityType;
  relatedActivityId?: string;
  isPublished?: boolean;
  attachments?: CalendarEventAttachment[];
  courseId?: string;
}

export interface UpdateCalendarEventDto {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  category?: EventCategory;
  color?: string;
  type?: CalendarEventType;
  targetAudience?: EventTargetAudience;
  relatedActivityType?: RelatedActivityType;
  relatedActivityId?: string;
  isPublished?: boolean;
  attachments?: CalendarEventAttachment[];
}

export interface CalendarEventWithTimeRemaining {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  isOnline: boolean;
  meetingLink: string | null;
  category: EventCategory;
  color: string;
  type: CalendarEventType;
  targetAudience: EventTargetAudience;
  relatedActivityType: RelatedActivityType;
  relatedActivityId: string | null;
  isPublished: boolean;
  attachments?: CalendarEventAttachment[];
  userId: string | null;
  courseId: string | null;
  course?: {
    id: string;
    name: string;
    code: string;
    thumbnailColor: string;
  };
  createdAt: string;
  updatedAt: string;
  timeRemaining?: string;
}
