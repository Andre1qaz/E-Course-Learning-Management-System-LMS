import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { EmailOptions, EmailType } from './interfaces/email.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter() {
    const emailConfig = this.configService.get('email');

    // Check if email configuration is available
    if (!emailConfig || !emailConfig.host || !emailConfig.auth?.user || !emailConfig.auth?.pass) {
      this.logger.warn('Email configuration is incomplete. Email functionality will be disabled.');
      this.logger.warn('Required fields: host, auth.user, auth.pass');
      this.transporter = null;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.auth.user,
          pass: emailConfig.auth.pass,
        },
      });

      // Verify SMTP connection
      this.transporter.verify((error, success) => {
        if (error) {
          this.logger.error('SMTP connection error:', error);
          this.logger.warn('Email functionality will be disabled due to SMTP connection failure');
          this.transporter = null;
        } else {
          this.logger.log('SMTP server is ready to send emails');
        }
      });
    } catch (error) {
      this.logger.error('Error initializing email transporter:', error);
      this.transporter = null;
    }
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');

    try {
      const templateFiles = fs.readdirSync(templatesDir);

      templateFiles.forEach((file) => {
        if (file.endsWith('.hbs')) {
          const templateName = file.replace('.hbs', '');
          const templatePath = path.join(templatesDir, file);
          const templateContent = fs.readFileSync(templatePath, 'utf-8');
          const template = handlebars.compile(templateContent);
          this.templates.set(templateName, template);
          this.logger.log(`Template loaded: ${templateName}`);
        }
      });
      this.logger.log(`Successfully loaded ${this.templates.size} email templates`);
    } catch (error) {
      if (error instanceof Error && (error as any).code === 'ENOENT') {
        this.logger.warn('Email templates directory not found. Email functionality will be limited.');
        this.logger.warn('Templates directory path:', templatesDir);
      } else {
        this.logger.error('Error loading email templates:', error);
      }
    }
  }

  private getTemplate(templateName: string): handlebars.TemplateDelegate {
    const template = this.templates.get(templateName);
    if (!template) {
      this.logger.warn(`Template not found: ${templateName}, using fallback`);
      // Provide a simple fallback template
      return handlebars.compile(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>{{title}}</h2>
          <p>{{message}}</p>
          {{#if actionUrl}}
          <a href="{{actionUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">{{actionText}}</a>
          {{/if}}
        </div>
      `);
    }
    return template;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    // Check if transporter is available
    if (!this.transporter) {
      this.logger.warn(`Email sending skipped - transporter not available for ${options.to}`);
      this.logger.warn('Check email configuration and SMTP credentials');
      return;
    }

    try {
      const emailConfig = this.configService.get('email');
      const template = this.getTemplate(options.template);

      const context = {
        ...options.context,
        year: new Date().getFullYear(),
        // Fallback context for missing templates
        title: options.subject,
        message: options.context?.message || 'This is an automated notification from E-Course LMS.',
      };

      const html = template(context);

      const mailOptions = {
        from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
        to: options.to,
        subject: options.subject,
        html,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${options.to}:`, error);
      throw error;
    }
  }

  async sendForgotPasswordEmail(
    email: string,
    name: string,
    resetToken: string,
    resetUrl: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Reset Password - E-Course LMS',
      template: EmailType.FORGOT_PASSWORD,
      context: {
        name,
        resetToken,
        resetUrl,
        message: `Hello ${name}, you requested a password reset. Click the button below to reset your password.`,
        actionUrl: resetUrl,
        actionText: 'Reset Password',
      },
    });
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    loginUrl: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Selamat Datang di E-Course LMS',
      template: EmailType.WELCOME,
      context: {
        name,
        email,
        loginUrl,
        message: `Hello ${name}, welcome to E-Course LMS! We're excited to have you on board.`,
        actionUrl: loginUrl,
        actionText: 'Login to Your Account',
      },
    });
  }

  async sendNotificationEmail(
    email: string,
    name: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionText?: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: title,
      template: EmailType.NOTIFICATION,
      context: {
        name,
        title,
        message,
        actionUrl,
        actionText,
      },
    });
  }

  async sendCourseEnrollmentEmail(
    email: string,
    name: string,
    courseName: string,
    instructorName: string,
    courseDescription: string,
    courseUrl: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Pendaftaran Kursus Berhasil',
      template: EmailType.COURSE_ENROLLMENT,
      context: {
        name,
        courseName,
        instructorName,
        courseDescription,
        courseUrl,
      },
    });
  }

  async sendAssignmentDueEmail(
    email: string,
    name: string,
    assignmentTitle: string,
    courseName: string,
    dueDate: string,
    timeRemaining: string,
    assignmentUrl: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Pengingat Tugas - E-Course LMS',
      template: EmailType.ASSIGNMENT_DUE,
      context: {
        name,
        assignmentTitle,
        courseName,
        dueDate,
        timeRemaining,
        assignmentUrl,
      },
    });
  }

  async sendExamReminderEmail(
    email: string,
    name: string,
    examTitle: string,
    courseName: string,
    examDate: string,
    examTime: string,
    duration: string,
    examUrl: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Pengingat Ujian - E-Course LMS',
      template: EmailType.EXAM_REMINDER,
      context: {
        name,
        examTitle,
        courseName,
        examDate,
        examTime,
        duration,
        examUrl,
      },
    });
  }

  async sendForumReplyEmail(
    email: string,
    name: string,
    replierName: string,
    originalPost: string,
    replyContent: string,
    forumUrl: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Balasan Forum Baru - E-Course LMS',
      template: EmailType.FORUM_REPLY,
      context: {
        name,
        replierName,
        originalPost,
        replyContent,
        forumUrl,
      },
    });
  }
}
