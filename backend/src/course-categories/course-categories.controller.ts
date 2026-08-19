import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CourseCategoriesService } from './course-categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// Heuristic #1: Visibility of System Status — clear API responses
// Heuristic #5: Error Prevention — role-based access control

@ApiTags('Course Categories')
@Controller('course-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CourseCategoriesController {
  constructor(private courseCategoriesService: CourseCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all course categories' })
  @ApiQuery({ name: 'isActive', required: false })
  async findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Query('isActive') isActive?: string,
  ) {
    return this.courseCategoriesService.findAll(userId, role, {
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async findOne(@Param('id') id: string) {
    return this.courseCategoriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new category (Admin only)' })
  @Roles(Role.ADMIN)
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.courseCategoriesService.create(userId, role, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category (Admin only)' })
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.courseCategoriesService.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  @Roles(Role.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.courseCategoriesService.remove(id, userId, role);
  }
}
