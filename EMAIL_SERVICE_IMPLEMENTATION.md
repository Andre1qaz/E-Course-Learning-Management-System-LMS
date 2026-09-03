# Email Service Implementation

This document describes the Email Service Implementation for the E-Course LMS project, including SMTP configuration, email templates, and BullMQ queue processing.

## Overview

The email service provides a robust, production-ready email system with the following features:

- **SMTP Configuration**: Configurable email server settings
- **Email Templates**: Pre-built templates for various email types
- **Queue Processing**: BullMQ for asynchronous email processing
- **Retry Mechanism**: Automatic retry with exponential backoff
- **Error Handling**: Comprehensive error handling and logging

## Installation

The following dependencies were installed:

```bash
npm install nodemailer handlebars @types/nodemailer
```

## Configuration

### Environment Variables

Add the following configuration to your `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@ecourse.com
SMTP_FROM_NAME=E-Course LMS
EMAIL_QUEUE_NAME=email-queue

# Frontend Configuration (for email links)
FRONTEND_URL=http://localhost:3000

# Redis Configuration (required for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Gmail Setup

For Gmail, you need to:

1. Enable 2-Factor Authentication
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this app password as `SMTP_PASSWORD`

## Email Templates

The following email templates are available in `src/email/templates/`:

### 1. Forgot Password (`forgot-password.hbs`)
- **Purpose**: Password reset instructions
- **Context Variables**: `name`, `resetToken`, `resetUrl`
- **Usage**: Called automatically in forgot password flow

### 2. Welcome (`welcome.hbs`)
- **Purpose**: Welcome email for new users
- **Context Variables**: `name`, `email`, `loginUrl`
- **Usage**: Called automatically after user registration

### 3. Notification (`notification.hbs`)
- **Purpose**: General notifications
- **Context Variables**: `name`, `title`, `message`, `actionUrl`, `actionText`
- **Usage**: Can be used for custom notifications

### 4. Course Enrollment (`course-enrollment.hbs`)
- **Purpose**: Course enrollment confirmation
- **Context Variables**: `name`, `courseName`, `instructorName`, `courseDescription`, `courseUrl`
- **Usage**: Can be called when user enrolls in a course

### 5. Assignment Due (`assignment-due.hbs`)
- **Purpose**: Assignment deadline reminder
- **Context Variables**: `name`, `assignmentTitle`, `courseName`, `dueDate`, `timeRemaining`, `assignmentUrl`
- **Usage**: Can be called for assignment reminders

### 6. Exam Reminder (`exam-reminder.hbs`)
- **Purpose**: Exam reminder notification
- **Context Variables**: `name`, `examTitle`, `courseName`, `examDate`, `examTime`, `duration`, `examUrl`
- **Usage**: Can be called for exam reminders

### 7. Forum Reply (`forum-reply.hbs`)
- **Purpose**: Forum reply notification
- **Context Variables**: `name`, `replierName`, `originalPost`, `replyContent`, `forumUrl`
- **Usage**: Can be called when someone replies to a forum post

## Usage

### Using EmailQueueService

The recommended way to send emails is through the `EmailQueueService`, which handles queue processing:

```typescript
import { EmailQueueService } from './email/email-queue.service';

constructor(private readonly emailQueueService: EmailQueueService) {}

// Send forgot password email
await this.emailQueueService.addForgotPasswordJob(
  'user@example.com',
  'John Doe',
  'reset-token-123',
  'https://example.com/reset-password?token=reset-token-123'
);

// Send welcome email
await this.emailQueueService.addWelcomeJob(
  'user@example.com',
  'John Doe',
  'https://example.com/login'
);

// Send notification email
await this.emailQueueService.addNotificationJob(
  'user@example.com',
  'John Doe',
  'Course Update',
  'Your course has been updated with new content.',
  'https://example.com/course/123',
  'View Course'
);

// Send course enrollment email
await this.emailQueueService.addCourseEnrollmentJob(
  'user@example.com',
  'John Doe',
  'Introduction to Programming',
  'Dr. Smith',
  'Learn programming fundamentals',
  'https://example.com/course/123'
);

// Send assignment due email
await this.emailQueueService.addAssignmentDueJob(
  'user@example.com',
  'John Doe',
  'Homework 1',
  'Introduction to Programming',
  '2026-09-10 23:59:59',
  '2 days',
  'https://example.com/assignment/456'
);

// Send exam reminder email
await this.emailQueueService.addExamReminderJob(
  'user@example.com',
  'John Doe',
  'Midterm Exam',
  'Introduction to Programming',
  '2026-09-15',
  '10:00 AM',
  '2 hours',
  'https://example.com/exam/789'
);

// Send forum reply email
await this.emailQueueService.addForumReplyJob(
  'user@example.com',
  'John Doe',
  'Jane Smith',
  'How to solve this problem?',
  'Here is the solution...',
  'https://example.com/forum/post/123'
);
```

### Using EmailService Directly

For immediate email sending (not recommended for production):

```typescript
import { EmailService } from './email/email.service';

constructor(private readonly emailService: EmailService) {}

// Send email directly
await this.emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Custom Email',
  template: 'notification',
  context: {
    name: 'John Doe',
    title: 'Custom Notification',
    message: 'This is a custom notification.',
  },
});
```

## Integration with Authentication

The email service is already integrated with the authentication system:

1. **Registration**: Welcome email is automatically sent when a new user registers
2. **Forgot Password**: Reset password email is automatically sent when users request password reset

### Example Integration

```typescript
// In auth.service.ts
constructor(
  private prisma: PrismaService,
  private jwtService: JwtService,
  private emailQueueService: EmailQueueService, // Injected
) {}

// Registration - Welcome email is sent automatically
async register(dto: RegisterDto): Promise<ApiResponse> {
  // ... registration logic ...
  
  // Queue welcome email
  try {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    await this.emailQueueService.addWelcomeJob(
      user.email,
      user.name,
      loginUrl,
    );
  } catch (error) {
    console.error('Failed to queue welcome email:', error);
  }
  
  return { success: true, data: user, message: 'Registrasi berhasil. Silakan login.' };
}

// Forgot Password - Reset email is sent automatically
async forgotPassword(dto: ForgotPasswordDto): Promise<ApiResponse> {
  // ... forgot password logic ...
  
  // Queue forgot password email
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    await this.emailQueueService.addForgotPasswordJob(
      user.email,
      user.name,
      resetToken,
      resetUrl,
    );
  } catch (error) {
    console.error('Failed to queue forgot password email:', error);
  }
  
  return { success: true, data: null, message: 'Instruksi reset password telah dikirim ke email institusi Anda. Periksa inbox Anda.' };
}
```

## Queue Monitoring

You can monitor the email queue using the provided controller:

```typescript
// GET /email/queue-stats
// Returns queue statistics
{
  "success": true,
  "data": {
    "waiting": 5,
    "active": 2,
    "completed": 100,
    "failed": 1
  },
  "message": "Queue stats retrieved successfully"
}
```

## Architecture

### Components

1. **EmailService**: Core email sending functionality using Nodemailer
2. **EmailQueueService**: Queue management using BullMQ
3. **EmailProcessor**: Background job processor using WorkerHost
4. **EmailController**: HTTP endpoints for queue management
5. **EmailModule**: NestJS module configuration

### Flow

```
User Action → Service → EmailQueueService → BullMQ Queue → EmailProcessor → EmailService → SMTP Server
```

### Error Handling

- Email jobs are automatically retried up to 3 times with exponential backoff
- Failed jobs are kept in the queue for investigation
- Comprehensive logging for debugging
- Email failures don't break user workflows (fire-and-forget pattern)

## Testing

To test the email service:

1. Configure SMTP settings in `.env`
2. Start Redis server
3. Start the application
4. Trigger an email action (registration, forgot password, etc.)
5. Check logs for email processing status
6. Monitor queue stats via `/email/queue-stats`

## Customization

### Adding New Email Templates

1. Create a new Handlebars template in `src/email/templates/`
2. Add the template name to `EmailType` enum in `interfaces/email.interface.ts`
3. Add corresponding methods in `EmailService` and `EmailQueueService`
4. Add job processing in `EmailProcessor`

### Custom SMTP Configuration

You can customize SMTP settings in the `.env` file or by modifying `email.config.ts`:

```typescript
export default registerAs('email', () => ({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
  from: process.env.SMTP_FROM || 'noreply@ecourse.com',
  fromName: process.env.SMTP_FROM_NAME || 'E-Course LMS',
  queueName: process.env.EMAIL_QUEUE_NAME || 'email-queue',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
}));
```

## Troubleshooting

### Emails not sending

1. Check SMTP credentials in `.env`
2. Verify Redis is running
3. Check application logs for errors
4. Monitor queue stats: `GET /email/queue-stats`

### Connection errors

1. Verify SMTP server accessibility
2. Check firewall settings
3. Ensure port is not blocked
4. Test SMTP configuration with external tools

### Template errors

1. Verify template files exist in `src/email/templates/`
2. Check Handlebars syntax
3. Ensure all context variables are provided

## Security Considerations

- Never commit SMTP credentials to version control
- Use environment variables for sensitive configuration
- Implement rate limiting for email endpoints
- Validate email addresses before queuing
- Use App Passwords for Gmail instead of regular passwords

## Performance

- Email processing is asynchronous and doesn't block user requests
- Queue processing can be scaled horizontally
- Redis provides high-performance queue management
- Automatic retry mechanism ensures email delivery

## Maintenance

- Monitor queue statistics regularly
- Clean up old completed/failed jobs
- Update email templates as needed
- Review logs for error patterns
- Keep dependencies updated

## Future Enhancements

- Email scheduling (send at specific times)
- Email templates with dynamic content
- Email tracking and analytics
- Multi-language support
- Email attachments support
- HTML email editor
- A/B testing for email content

## Support

For issues or questions about the email service implementation, please refer to:

- Nodemailer documentation: https://nodemailer.com/
- BullMQ documentation: https://docs.bullmq.io/
- Handlebars documentation: https://handlebarsjs.com/
- NestJS documentation: https://docs.nestjs.com/