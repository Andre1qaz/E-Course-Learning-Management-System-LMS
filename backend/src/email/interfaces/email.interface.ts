export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  html: string;
  text?: string;
}

export enum EmailType {
  FORGOT_PASSWORD = 'forgot-password',
  WELCOME = 'welcome',
  NOTIFICATION = 'notification',
  COURSE_ENROLLMENT = 'course-enrollment',
  ASSIGNMENT_DUE = 'assignment-due',
  EXAM_REMINDER = 'exam-reminder',
  FORUM_REPLY = 'forum-reply',
}
