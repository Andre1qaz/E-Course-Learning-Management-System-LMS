export interface CalendarEvent {
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
  category: string;
  color: string;
  type: "DEADLINE" | "PERSONAL_NOTE" | "ANNOUNCEMENT";
  targetAudience: "ALL_STUDENTS" | "COURSE_STUDENTS";
  relatedActivityType: "ASSIGNMENT" | "EXAM" | "MODULE" | "ACTIVITY" | "NONE";
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

export interface CalendarEventAttachment {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface CreateCalendarEventData {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  category?: string;
  color?: string;
  type?: "DEADLINE" | "PERSONAL_NOTE" | "ANNOUNCEMENT";
  targetAudience?: "ALL_STUDENTS" | "COURSE_STUDENTS";
  relatedActivityType?: "ASSIGNMENT" | "EXAM" | "MODULE" | "ACTIVITY" | "NONE";
  relatedActivityId?: string;
  isPublished?: boolean;
  attachments?: CalendarEventAttachment[];
  courseId?: string;
}

export interface UpdateCalendarEventData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  category?: string;
  color?: string;
  type?: "DEADLINE" | "PERSONAL_NOTE" | "ANNOUNCEMENT";
  targetAudience?: "ALL_STUDENTS" | "COURSE_STUDENTS";
  relatedActivityType?: "ASSIGNMENT" | "EXAM" | "MODULE" | "ACTIVITY" | "NONE";
  relatedActivityId?: string;
  isPublished?: boolean;
  attachments?: CalendarEventAttachment[];
}
