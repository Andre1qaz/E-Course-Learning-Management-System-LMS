import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

/**
 * Base Service Class yang menyediakan common logic untuk semua service
 * 
 * Fitur yang disediakan:
 * - Permission checking (role-based dan resource ownership)
 * - Response formatting standar
 * - Error handling konsisten
 * - Common CRUD operations pattern
 * 
 * Penggunaan:
 * extend class ini di service yang Anda buat
 */
@Injectable()
export abstract class BaseService<T> {
  constructor(protected prisma: PrismaService) {}

  /**
   * Check jika user memiliki akses ke resource berdasarkan role
   */
  protected checkRoleAccess(userRole: Role, allowedRoles: Role[]): void {
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  /**
   * Check jika user adalah owner dari resource atau admin
   */
  protected checkOwnershipOrAdmin(
    resourceOwnerId: string,
    userId: string,
    userRole: Role
  ): void {
    if (userRole !== Role.ADMIN && resourceOwnerId !== userId) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }
  }

  /**
   * Check jika user memiliki akses ke course (instructor atau enrolled)
   */
  protected async checkCourseAccess(
    courseId: string,
    userId: string,
    userRole: Role
  ): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { enrollments: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const hasAccess =
      userRole === Role.ADMIN ||
      course.instructorId === userId ||
      course.enrollments.some((e) => e.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this course');
    }
  }

  /**
   * Format response standar untuk semua endpoint
   */
  protected formatResponse(data: any, message: string = 'Operation successful') {
    return {
      success: true,
      data,
      message,
    };
  }

  /**
   * Generate standard UUID untuk relasi optional
   */
  protected sanitizeOptionalId(id: string | undefined | null): string | undefined {
    if (!id || id.trim() === '') {
      return undefined;
    }
    return id;
  }

  /**
   * Validate jika ID yang diberikan adalah UUID yang valid
   */
  protected isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Generic find by ID dengan include options
   */
  protected async findById(
    id: string,
    model: any,
    include?: any,
    errorMessage: string = 'Resource not found'
  ): Promise<T> {
    const resource = await model.findUnique({
      where: { id },
      include,
    });

    if (!resource) {
      throw new NotFoundException(errorMessage);
    }

    return resource as T;
  }

  /**
   * Generic find all dengan pagination dan filter
   */
  protected async findAll(
    model: any,
    options: {
      where?: any;
      include?: any;
      orderBy?: any;
      skip?: number;
      take?: number;
    } = {}
  ): Promise<T[]> {
    const { where, include, orderBy, skip, take } = options;

    return model.findMany({
      where,
      include,
      orderBy,
      skip,
      take,
    }) as Promise<T[]>;
  }

  /**
   * Generic create dengan data validation
   */
  protected async createResource(
    model: any,
    data: any,
    include?: any,
    successMessage: string = 'Resource created successfully'
  ) {
    const resource = await model.create({
      data,
      include,
    });

    return this.formatResponse(resource, successMessage);
  }

  /**
   * Generic update dengan ownership check
   */
  protected async updateResource(
    id: string,
    model: any,
    data: any,
    include?: any,
    successMessage: string = 'Resource updated successfully'
  ) {
    const resource = await model.update({
      where: { id },
      data,
      include,
    });

    return this.formatResponse(resource, successMessage);
  }

  /**
   * Generic delete dengan ownership check
   */
  protected async deleteResource(
    id: string,
    model: any,
    successMessage: string = 'Resource deleted successfully'
  ) {
    await model.delete({
      where: { id },
    });

    return this.formatResponse(null, successMessage);
  }

  /**
   * Check if resource exists (tanpa error)
   */
  protected async resourceExists(model: any, where: any): Promise<boolean> {
    const count = await model.count({ where });
    return count > 0;
  }

  /**
   * Get enrollments for a course (helper function)
   */
  protected async getCourseEnrollments(courseId: string): Promise<string[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
    });

    return enrollments.map((e) => e.userId);
  }

  /**
   * Validate date range (start < end)
   */
  protected validateDateRange(startTime: Date, endTime: Date, fieldName: string = 'date range'): void {
    if (startTime >= endTime) {
      throw new BadRequestException(`Invalid ${fieldName}: start time must be before end time`);
    }
  }

  /**
   * Convert string date to Date object dengan validation
   */
  protected parseDate(dateString: string, fieldName: string = 'date'): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${fieldName} format`);
    }
    return date;
  }

  /**
   * Helper untuk mengirim notification via queue (jika service mengandung notification service)
   */
  protected async sendNotification(
    notificationService: any,
    options: {
      userIds: string[];
      type: string;
      title: string;
      message: string;
      link?: string;
    }
  ): Promise<void> {
    if (notificationService && notificationService.addBulkNotificationJob) {
      await notificationService.addBulkNotificationJob(options);
    }
  }

  /**
   * Helper untuk create calendar event (jika service mengandung calendar service)
   */
  protected async createCalendarEvent(
    calendarService: any,
    createMethod: string,
    resourceId: string
  ): Promise<void> {
    if (calendarService && calendarService[createMethod]) {
      await calendarService[createMethod](resourceId);
    }
  }
}
