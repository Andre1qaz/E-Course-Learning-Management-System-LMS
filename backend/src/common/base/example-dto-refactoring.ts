/**
 * CONTOH REFACTORING DTO MENGGUNAKAN CUSTOM DECORATORS
 * 
 * Ini adalah contoh bagaimana DTO bisa disederhanakan menggunakan custom decorators
 * untuk mengurangi boilerplate code dan membuatnya lebih konsisten.
 */

// ============================================
// SEBELUM (Original create-course.dto.ts)
// ============================================

/*
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsHexColor, 
  MaxLength
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  learningObjectives?: string;

  @IsHexColor()
  @IsOptional()
  thumbnailColor?: string;

  @IsOptional()
  isLinear?: boolean;

  @IsString()
  @IsOptional()
  categoryId?: string;
}
*/

// ============================================
// SESUDAH (Refactored dengan Custom Decorators)
// ============================================

import { 
  RequiredString, 
  OptionalString, 
  DescriptionField, 
  LearningObjectivesField,
  ColorField,
  BooleanField,
  OptionalIdField
} from '../../common/base/dto.decorators';

export class CreateCourseDtoRefactored {
  @RequiredString(200)
  name!: string;

  @RequiredString(20)
  code!: string;

  @DescriptionField(1000)
  description?: string;

  @LearningObjectivesField(2000)
  learningObjectives?: string;

  @ColorField()
  thumbnailColor?: string;

  @BooleanField()
  isLinear?: boolean;

  @OptionalIdField()
  categoryId?: string;
}

// ============================================
// CONTOH LAIN: Assignment DTO
// ============================================

// SEBELUM:
/*
import { IsString, IsNotEmpty, IsOptional, IsNumber, MaxLength, IsDateString } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  deadline!: string;

  @IsNumber()
  @IsNotEmpty()
  maxScore!: number;
}
*/

// SESUDAH:
import { RequiredString, DescriptionField, RequiredDate, RequiredNumber } from '../../common/base/dto.decorators';

export class CreateAssignmentDtoRefactored {
  @RequiredString(200)
  title!: string;

  @DescriptionField(2000)
  description?: string;

  @RequiredDate()
  deadline!: string;

  @RequiredNumber(0, 100)
  maxScore!: number;
}

// ============================================
// CONTOH LAIN: Exam DTO
// ============================================

// SEBELUM:
/*
import { IsString, IsNotEmpty, IsOptional, IsNumber, MaxLength, IsDateString, IsBoolean } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @IsDateString()
  @IsNotEmpty()
  deadline!: string;

  @IsNumber()
  @IsNotEmpty()
  duration!: number;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
*/

// SESUDAH:
import { RequiredString, DescriptionField, RequiredDate, RequiredNumber, BooleanField } from '../../common/base/dto.decorators';

export class CreateExamDtoRefactored {
  @RequiredString(200)
  title!: string;

  @DescriptionField(2000)
  description?: string;

  @RequiredDate()
  startTime!: string;

  @RequiredDate()
  deadline!: string;

  @RequiredNumber(1, 480) // 1 min to 8 hours
  duration!: number;

  @BooleanField()
  isPublished?: boolean;
}

// ============================================
// CONTOH LAIN: Resource Baru dengan Berbagai Tipe
// ============================================

/**
 * Contoh DTO untuk resource baru yang kompleks
 * Menunjukkan berbagai tipe field yang tersedia
 */
export class CreateComplexResourceDto {
  // String fields
  @RequiredString(100)
  name!: string;

  @OptionalString(500)
  subtitle?: string;

  @DescriptionField(2000)
  description?: string;

  @LearningObjectivesField(5000)
  objectives?: string;

  // ID fields
  @IdField()
  courseId!: string;

  @OptionalIdField()
  moduleId?: string;

  // Number fields
  @RequiredNumber(0, 100)
  score!: number;

  @OptionalNumber(1, 10)
  rating?: number;

  // Date fields
  @RequiredDate()
  startDate!: string;

  @OptionalDate()
  endDate?: string;

  // Boolean fields
  @BooleanField()
  isActive?: boolean;

  @BooleanField()
  isPublic?: boolean;

  // Color field
  @ColorField()
  themeColor?: string;
}

// ============================================
// PERBANDINGAN
// ============================================

/**
 * KEUNTUNGAN MENGGUNAKAN CUSTOM DECORATORS:
 * 
 * 1. ✅ Less Boilerplate:
 *    - SEBELUM: 3-4 decorator per field (@IsString, @IsNotEmpty, @MaxLength, dll)
 *    - SESUDAH: 1 decorator per field (@RequiredString, @OptionalString, dll)
 * 
 * 2. ✅ Consistency:
 *    - SEBELUM: Bisa lupa salah satu decorator
 *    - SESUDAH: Semua validasi tercakup dalam 1 decorator
 * 
 * 3. ✅ Readability:
 *    - SEBELUM: Harus baca beberapa decorator untuk mengerti field
 *    - SESUDAH: Nama decorator jelas menggambarkan field
 * 
 * 4. ✅ Type Safety:
 *    - SEBELUM: Validasi tipe manual
 *    - SESUDAH: Tipe validasi otomatis dari decorator
 * 
 * 5. ✅ Maintainability:
 *    - SEBELUM: Perubahan validasi harus di banyak tempat
 *    - SESUDAH: Perubahan cukup di 1 decorator
 * 
 * 6. ✅ Self-Documenting:
 *    - SEBELUM: Harus baca documentation untuk mengerti pattern
 *    - SESUDAH: Nama decorator jelas dan intuitive
 * 
 * 7. ✅ Reusability:
 *    - SEBELUM: Pattern harus di-copy paste
 *    - SESUDAH: Decorator siap pakai di semua DTO
 * 
 * 8. ✅ Standardization:
 *    - SEBELUM: Bisa ada variasi antar DTO
 *    - SESUDAH: Semua DTO mengikuti standard yang sama
 */

// ============================================
// MAPPING TABLE
// ============================================

/**
 * PATTERN MAPPING:
 * 
 * CLASS-VALIDATOR PATTERN           ->  CUSTOM DECORATOR
 * ================================================
 * @IsString() + @IsNotEmpty() +     ->  @RequiredString(maxLength)
 * @MaxLength(max)
 * 
 * @IsString() + @IsOptional() +     ->  @OptionalString(maxLength)
 * @MaxLength(max)
 * 
 * @IsString() + @IsOptional() +     ->  @DescriptionField(maxLength)
 * @MaxLength(max) [long text]
 * 
 * @IsDateString() + @IsNotEmpty()   ->  @RequiredDate()
 * 
 * @IsDateString() + @IsOptional()   ->  @OptionalDate()
 * 
 * @IsNumber() + @IsNotEmpty() +     ->  @RequiredNumber(min, max)
 * @Min(min) + @Max(max)
 * 
 * @IsNumber() + @IsOptional() +     ->  @OptionalNumber(min, max)
 * @Min(min) + @Max(max)
 * 
 * @IsBoolean() + @IsOptional()      ->  @BooleanField()
 * 
 * @IsHexColor() + @IsOptional()     ->  @ColorField()
 * 
 * @IsString() + @IsUUID() +         ->  @IdField()
 * @IsNotEmpty()
 * 
 * @IsString() + @IsUUID() +         ->  @OptionalIdField()
 * @IsOptional()
 */
