import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Role } from '@prisma/client';
import { AutoValidator } from '../common/base/validation-guide';

// Heuristic #1: Visibility of System Status — clear success/error messages
// Heuristic #5: Error Prevention — validate permissions and data before operations

@Injectable()
export class CourseCategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new course category (Admin only)
   * Heuristic #5: Error Prevention — validate unique category name
   * ✅ MENGGUNAKAN AutoValidator untuk otomatis format handling
   */
  async create(userId: string, userRole: Role, dto: CreateCategoryDto) {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      name: { type: 'string', required: true, maxLength: 100 },
      academicYear: { type: 'string', required: false, maxLength: 20 },
      isActive: { type: 'boolean', required: false },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only Admin can create course categories');
    }

    // Check if category name already exists
    const existingCategory = await this.prisma.courseCategory.findUnique({
      where: { name: result.sanitized.name },
    });

    if (existingCategory) {
      throw new ConflictException('Category name already exists');
    }

    // ✅ Create dengan data yang sudah divalidasi
    const category = await this.prisma.courseCategory.create({
      data: {
        name: result.sanitized.name,
        academicYear: result.sanitized.academicYear || result.sanitized.name,
        isActive: result.sanitized.isActive ?? true,
      },
    });

    return {
      success: true,
      data: category,
      message: 'Course category created successfully',
    };
  }

  /**
   * Get all course categories
   * Heuristic #7: Flexibility and Efficiency of Use — filter by active status
   */
  async findAll(
    userId: string,
    userRole: Role,
    filters?: { isActive?: boolean },
  ) {
    const where: { isActive?: boolean } = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const categories = await this.prisma.courseCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    return {
      success: true,
      data: categories,
      message: 'Course categories retrieved successfully',
    };
  }

  /**
   * Get category by ID
   */
  async findOne(id: string) {
    const category = await this.prisma.courseCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
        courses: {
          select: {
            id: true,
            name: true,
            code: true,
            instructor: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      success: true,
      data: category,
      message: 'Category retrieved successfully',
    };
  }

  /**
   * Update course category (Admin only)
   */
  async update(
    id: string,
    userId: string,
    userRole: Role,
    dto: UpdateCategoryDto,
  ) {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only Admin can update course categories');
    }

    const category = await this.prisma.courseCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if new name conflicts with existing category
    if (dto.name && dto.name !== category.name) {
      const existingCategory = await this.prisma.courseCategory.findUnique({
        where: { name: dto.name },
      });

      if (existingCategory) {
        throw new ConflictException('Category name already exists');
      }
    }

    const updatedCategory = await this.prisma.courseCategory.update({
      where: { id },
      data: dto,
    });

    return {
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully',
    };
  }

  /**
   * Delete course category (Admin only)
   * Heuristic #5: Error Prevention — prevent deletion if category has courses
   */
  async remove(id: string, userId: string, userRole: Role) {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only Admin can delete course categories');
    }

    const category = await this.prisma.courseCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Prevent deletion if category has courses
    if (category._count.courses > 0) {
      throw new ForbiddenException(
        'Cannot delete category with existing courses. Please reassign or delete courses first.',
      );
    }

    await this.prisma.courseCategory.delete({
      where: { id },
    });

    return {
      success: true,
      data: null,
      message: 'Category deleted successfully',
    };
  }
}
