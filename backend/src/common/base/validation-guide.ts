/**
 * PANDUAN VALIDASI OTOMATIS - TIDAK ADA ERROR LAGI!
 * 
 * Sistem ini OTOMATIS handle semua format dan validation:
 * - UUID (dengan/without dashes)
 * - Dates (berbagai format)
 * - Numbers (dengan range validation)
 * - Strings (dengan length validation)
 * - Booleans (berbagai format)
 * - Enums (valid values check)
 * 
 * SEMUA ERROR MESSAGE DALAM BAHASA INDONESIA!
 */

import { BadRequestException } from '@nestjs/common';

/**
 * VALIDATOR SEDERHANA - Satu class untuk semua validation
 */
export class AutoValidator {
  /**
   * Validate UUID dengan auto-format handling
   * Menerima format: dengan dashes atau tanpa dashes
   */
  static validateUUID(value: any, fieldName: string = 'ID'): string {
    if (!value || value.trim() === '') {
      throw new BadRequestException(`${fieldName} tidak boleh kosong`);
    }
    
    const normalizedId = value.trim().toLowerCase();
    
    // Format dengan dashes: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const withDashes = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (withDashes.test(normalizedId)) {
      return normalizedId;
    }
    
    // Format tanpa dashes: 32 karakter hex
    const withoutDashes = /^[0-9a-f]{32}$/i;
    if (withoutDashes.test(normalizedId)) {
      // Auto-convert ke format dengan dashes
      return [
        normalizedId.substring(0, 8),
        normalizedId.substring(8, 12),
        normalizedId.substring(12, 16),
        normalizedId.substring(16, 20),
        normalizedId.substring(20, 32)
      ].join('-');
    }
    
    throw new BadRequestException(
      `${fieldName} harus berupa UUID yang valid. Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx atau 32 karakter hex tanpa tanda hubung`
    );
  }

  /**
   * Validate optional UUID
   */
  static validateOptionalUUID(value: any, fieldName: string = 'ID'): string | undefined {
    if (!value || value.trim() === '') {
      return undefined;
    }
    
    return this.validateUUID(value, fieldName);
  }

  /**
   * Validate date dengan auto-format handling
   * Menerima berbagai format date
   */
  static validateDate(value: any, fieldName: string = 'tanggal'): Date {
    if (!value || value.trim() === '') {
      throw new BadRequestException(`${fieldName} tidak boleh kosong`);
    }
    
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        `${fieldName} harus berupa tanggal yang valid. Format: YYYY-MM-DD atau YYYY-MM-DDTHH:mm:ss`
      );
    }
    
    return date;
  }

  /**
   * Validate optional date
   */
  static validateOptionalDate(value: any, fieldName: string = 'tanggal'): Date | undefined {
    if (!value || value.trim() === '') {
      return undefined;
    }
    
    return this.validateDate(value, fieldName);
  }

  /**
   * Validate string
   */
  static validateString(value: any, fieldName: string = 'teks', maxLength?: number): string {
    if (!value || value.trim() === '') {
      throw new BadRequestException(`${fieldName} tidak boleh kosong`);
    }
    
    const sanitized = value.trim();
    
    if (maxLength && sanitized.length > maxLength) {
      throw new BadRequestException(`${fieldName} tidak boleh lebih dari ${maxLength} karakter`);
    }
    
    return sanitized;
  }

  /**
   * Validate optional string
   */
  static validateOptionalString(value: any, fieldName: string = 'teks', maxLength?: number): string | undefined {
    if (!value || value.trim() === '') {
      return undefined;
    }
    
    return this.validateString(value, fieldName, maxLength);
  }

  /**
   * Validate number
   */
  static validateNumber(value: any, fieldName: string = 'angka', min?: number, max?: number): number {
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
   * Validate optional number
   */
  static validateOptionalNumber(value: any, fieldName: string = 'angka', min?: number, max?: number): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    
    return this.validateNumber(value, fieldName, min, max);
  }

  /**
   * Validate boolean
   */
  static validateBoolean(value: any, fieldName: string = 'pilihan'): boolean {
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
   * Validate optional boolean
   */
  static validateOptionalBoolean(value: any, fieldName: string = 'pilihan'): boolean | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    
    return this.validateBoolean(value, fieldName);
  }

  /**
   * Validate enum
   */
  static validateEnum(value: any, validValues: any[], fieldName: string = 'pilihan'): any {
    if (!validValues.includes(value)) {
      throw new BadRequestException(
        `${fieldName} harus salah satu dari: ${validValues.join(', ')}`
      );
    }
    
    return value;
  }

  /**
   * SUPER VALIDATOR - Auto-detect tipe dan validate
   * Ini method yang paling mudah digunakan!
   */
  static autoValidate(value: any, fieldName: string = 'field', options?: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'date' | 'uuid' | 'auto';
    maxLength?: number;
    minLength?: number;
    min?: number;
    max?: number;
    enumValues?: any[];
  }): any {
    const { required = true, type = 'auto' } = options || {};
    
    // Handle optional
    if (!required && (value === undefined || value === null || value === '')) {
      return undefined;
    }
    
    // Auto-detect type
    let detectedType = type;
    if (type === 'auto') {
      if (typeof value === 'string') {
        if (this.isValidUUIDString(value)) {
          detectedType = 'uuid';
        } else if (!isNaN(Date.parse(value))) {
          detectedType = 'date';
        } else {
          detectedType = 'string';
        }
      } else if (typeof value === 'number') {
        detectedType = 'number';
      } else if (typeof value === 'boolean') {
        detectedType = 'boolean';
      }
    }
    
    // Validate berdasarkan tipe
    switch (detectedType) {
      case 'uuid':
        return this.validateUUID(value, fieldName);
      case 'date':
        return this.validateDate(value, fieldName);
      case 'string':
        return this.validateString(value, fieldName, options?.maxLength);
      case 'number':
        return this.validateNumber(value, fieldName, options?.min, options?.max);
      case 'boolean':
        return this.validateBoolean(value, fieldName);
      default:
        return value;
    }
  }

  /**
   * Auto-validate seluruh object
   * Cukup panggil method ini, semua format akan otomatis di-handle!
   */
  static validateObject(obj: any, schema?: {
    [key: string]: {
      required?: boolean;
      type?: 'string' | 'number' | 'boolean' | 'date' | 'uuid' | 'auto';
      maxLength?: number;
      minLength?: number;
      min?: number;
      max?: number;
      enumValues?: any[];
    };
  }): { valid: boolean; errors: string[]; sanitized: any } {
    const errors: string[] = [];
    const sanitized: any = {};
    
    const keys = schema ? Object.keys(schema) : Object.keys(obj);
    
    for (const key of keys) {
      const value = obj[key];
      const config = schema?.[key] || {};
      
      try {
        sanitized[key] = this.autoValidate(value, key, {
          required: config.required,
          type: config.type,
          maxLength: config.maxLength,
          minLength: config.minLength,
          min: config.min,
          max: config.max,
          enumValues: config.enumValues,
        });
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Helper untuk cek jika string adalah UUID
   */
  private static isValidUUIDString(value: string): boolean {
    const normalizedId = value.trim().toLowerCase();
    const withDashes = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const withoutDashes = /^[0-9a-f]{32}$/i;
    return withDashes.test(normalizedId) || withoutDashes.test(normalizedId);
  }
}

/**
 * CONTOH PENGGUNAAN YANG SANGAT SEDERHANA
 */

/*
// CONTOH 1: Validate UUID (auto-handle format)
const courseId = AutoValidator.validateUUID(someInput, 'Course ID');
// Input: "abc123def456..." (tanpa dashes) → Output: "abc123de-f456-..." (dengan dashes)

// CONTOH 2: Validate Date (auto-handle format)
const startDate = AutoValidator.validateDate(someInput, 'Tanggal mulai');
// Input: "2024-01-01" → Output: Date object
// Input: "2024-01-01T10:00:00" → Output: Date object

// CONTOH 3: Auto-validate seluruh object
const result = AutoValidator.validateObject(dto, {
  courseId: { type: 'uuid', required: true },
  title: { type: 'string', required: true, maxLength: 200 },
  maxScore: { type: 'number', required: true, min: 0, max: 100 },
  startDate: { type: 'date', required: true },
  published: { type: 'boolean', required: false },
});

if (!result.valid) {
  throw new BadRequestException(result.errors.join(', '));
}

// Gunakan result.sanitized untuk data yang sudah divalidasi

// CONTOH 4: Auto-detect type (paling mudah!)
const value = AutoValidator.autoValidate(input, 'Field name');
// Otomatis detect apakah ini UUID, date, string, number, atau boolean
*/
