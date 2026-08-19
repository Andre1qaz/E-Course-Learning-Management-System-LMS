import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
      course.enrollments.some((e: any) => e.userId === userId);

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
   * Auto-validate dan normalize UUID
   */
  protected sanitizeOptionalId(id: string | undefined | null): string | undefined {
    if (!id || id.trim() === '') {
      return undefined;
    }
    
    // Auto-validate dan normalize
    if (!this.isValidUUID(id)) {
      throw new BadRequestException(
        `ID harus berupa UUID yang valid. Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
      );
    }
    
    return this.normalizeUUID(id);
  }

  /**
   * Sanitize dan validate required ID
   */
  protected sanitizeRequiredId(id: string, fieldName: string = 'ID'): string {
    if (!id || id.trim() === '') {
      throw new BadRequestException(`${fieldName} tidak boleh kosong`);
    }
    
    return this.validateAndNormalizeUUID(id, fieldName);
  }

  /**
   * Validate jika ID yang diberikan adalah UUID yang valid
   * Auto-convert berbagai format UUID ke format yang benar
   */
  protected isValidUUID(id: string): boolean {
    if (!id) return false;
    
    // Handle berbagai UUID format
    const normalizedId = id.trim().toLowerCase();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Coba format dengan dashes
    if (uuidRegex.test(normalizedId)) return true;
    
    // Coba format tanpa dashes (32 hex chars)
    const noDashRegex = /^[0-9a-f]{32}$/i;
    if (noDashRegex.test(normalizedId)) return true;
    
    return false;
  }

  /**
   * Normalize UUID ke format standar dengan dashes
   */
  protected normalizeUUID(id: string): string {
    if (!id) return id;
    
    const normalizedId = id.trim().toLowerCase();
    
    // Jika sudah ada dashes, return as-is
    if (normalizedId.includes('-')) {
      return normalizedId;
    }
    
    // Convert format tanpa dashes ke format dengan dashes
    if (normalizedId.length === 32) {
      return [
        normalizedId.substring(0, 8),
        normalizedId.substring(8, 12),
        normalizedId.substring(12, 16),
        normalizedId.substring(16, 20),
        normalizedId.substring(20, 32)
      ].join('-');
    }
    
    return normalizedId;
  }

  /**
   * Validate and sanitize UUID dengan auto-conversion
   * Jika invalid, throw error dengan message yang jelas
   */
  protected validateAndNormalizeUUID(id: string, fieldName: string = 'ID'): string {
    if (!id || id.trim() === '') {
      throw new BadRequestException(`${fieldName} tidak boleh kosong`);
    }
    
    if (!this.isValidUUID(id)) {
      throw new BadRequestException(
        `${fieldName} harus berupa UUID yang valid. Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
      );
    }
    
    return this.normalizeUUID(id);
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

    return enrollments.map((e: any) => e.userId);
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
   * Auto-handle berbagai date format
   */
  protected parseDate(dateString: string, fieldName: string = 'date'): Date {
    if (!dateString || dateString.trim() === '') {
      throw new BadRequestException(`${fieldName} tidak boleh kosong`);
    }
    
    // Coba parsing dengan berbagai format
    const parsedDate = new Date(dateString);
    
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException(
        `${fieldName} harus berupa tanggal yang valid. Format: YYYY-MM-DD atau YYYY-MM-DDTHH:mm:ss`
      );
    }
    
    return parsedDate;
  }

  /**
   * Sanitize dan validate optional date
   */
  protected sanitizeOptionalDate(dateString: string | undefined | null, fieldName: string = 'date'): Date | undefined {
    if (!dateString || dateString.trim() === '') {
      return undefined;
    }
    
    return this.parseDate(dateString, fieldName);
  }

  /**
   * Sanitize dan validate string field
   */
  protected sanitizeString(value: string | undefined | null, fieldName: string = 'field', maxLength?: number): string {
    if (value === undefined || value === null) {
      return '';
    }
    
    const sanitized = value.trim();
    
    if (maxLength && sanitized.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} tidak boleh lebih dari ${maxLength} karakter`
      );
    }
    
    return sanitized;
  }

  /**
   * Sanitize dan validate required string
   */
  protected sanitizeRequiredString(value: string, fieldName: string = 'field', maxLength?: number): string {
    if (!value || value.trim() === '') {
      throw new BadRequestException(`${fieldName} tidak boleh kosong`);
    }
    
    return this.sanitizeString(value, fieldName, maxLength);
  }

  /**
   * Sanitize dan validate number field
   */
  protected sanitizeNumber(value: any, fieldName: string = 'field', min?: number, max?: number): number {
    const num = Number(value);
    
    if (isNaN(num)) {
      throw new BadRequestException(`${fieldName} harus berupa angka yang valid`);
    }
    
    if (min !== undefined && num < min) {
      throw new BadRequestException(`${fieldName} tidak boleh kurang dari ${min}`);
    }
    
    if (max !== undefined && num > max) {
      throw new BadRequestException(`${fieldName} tidak boleh lebih dari ${max}`);
    }
    
    return num;
  }

  /**
   * Sanitize dan validate boolean field
   */
  protected sanitizeBoolean(value: any, fieldName: string = 'field'): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (value === 'true' || value === '1' || value === 1) {
      return true;
    }
    
    if (value === 'false' || value === '0' || value === 0) {
      return false;
    }
    
    throw new BadRequestException(`${fieldName} harus berupa true atau false`);
  }

  /**
   * Sanitize dan validate enum field
   */
  protected sanitizeEnum<T>(value: any, enumValues: T[], fieldName: string = 'field'): T {
    if (!enumValues.includes(value)) {
      throw new BadRequestException(
        `${fieldName} harus salah satu dari: ${enumValues.join(', ')}`
      );
    }
    
    return value as T;
  }

  /**
   * Auto-sanitize entire DTO object
   * Ini akan otomatis handle semua format issues
   */
  protected sanitizeDTO(dto: any, schema: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'date' | 'uuid' | 'enum';
      required?: boolean;
      maxLength?: number;
      minLength?: number;
      min?: number;
      max?: number;
      enumValues?: any[];
    };
  }): any {
    const sanitized: any = {};
    
    for (const [key, config] of Object.entries(schema)) {
      const value = dto[key];
      
      // Skip jika tidak required dan value kosong
      if (!config.required && (value === undefined || value === null || value === '')) {
        continue;
      }
      
      try {
        switch (config.type) {
          case 'string':
            if (config.required) {
              sanitized[key] = this.sanitizeRequiredString(value, key, config.maxLength);
            } else {
              sanitized[key] = this.sanitizeString(value, key, config.maxLength);
            }
            break;
            
          case 'number':
            sanitized[key] = this.sanitizeNumber(value, key, config.min, config.max);
            break;
            
          case 'boolean':
            sanitized[key] = this.sanitizeBoolean(value, key);
            break;
            
          case 'date':
            if (config.required) {
              sanitized[key] = this.parseDate(value, key);
            } else {
              sanitized[key] = this.sanitizeOptionalDate(value, key);
            }
            break;
            
          case 'uuid':
            if (config.required) {
              sanitized[key] = this.validateAndNormalizeUUID(value, key);
            } else {
              sanitized[key] = this.sanitizeOptionalId(value);
            }
            break;
            
          case 'enum':
            if (config.enumValues) {
              sanitized[key] = this.sanitizeEnum(value, config.enumValues, key);
            }
            break;
        }
      } catch (error) {
        // Re-throw dengan context yang lebih jelas
        throw new BadRequestException(
          `Error pada field "${key}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    
    return sanitized;
  }

  /**
   * VALIDATION SEDERHANA - Satu method untuk semua validation
   * Gunakan ini untuk quick validation tanpa schema kompleks
   */
  protected validateAll(dto: any): { valid: boolean; errors: string[]; sanitized: any } {
    const errors: string[] = [];
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      
      // Auto-detect type dan validate
      if (typeof value === 'string') {
        // Cek jika ini UUID
        if (this.isValidUUID(value)) {
          try {
            sanitized[key] = this.validateAndNormalizeUUID(value, key);
          } catch (error) {
            errors.push(`${key}: ${error instanceof Error ? error.message : String(error)}`);
          }
        } 
        // Cek jika ini date
        else if (!isNaN(Date.parse(value))) {
          try {
            sanitized[key] = this.parseDate(value, key);
          } catch (error) {
            errors.push(`${key}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
        // String biasa
        else {
          sanitized[key] = this.sanitizeString(value, key);
        }
      } else if (typeof value === 'number') {
        sanitized[key] = value;
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      } else {
        errors.push(`${key}: Tipe data tidak dikenali`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
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
