import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

/**
 * Base Controller Class yang menyediakan common logic untuk semua controller
 * 
 * Fitur yang disediakan:
 * - Auto JWT authentication
 * - Auto role-based access control
 * - Standard CRUD endpoints pattern
 * - User context extraction from request
 * 
 * Penggunaan:
 * extend class ini di controller yang Anda buat
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export abstract class BaseController {
  /**
   * Extract user information from request
   */
  protected getUserFromRequest(request: any) {
    return {
      id: request.user?.id,
      email: request.user?.email,
      role: request.user?.role,
    };
  }

  /**
   * Extract user ID from request
   */
  protected getUserId(request: any): string {
    return request.user?.id;
  }

  /**
   * Extract user role from request
   */
  protected getUserRole(request: any): Role {
    return request.user?.role;
  }

  /**
   * Check if user is admin
   */
  protected isAdmin(request: any): boolean {
    return this.getUserRole(request) === Role.ADMIN;
  }

  /**
   * Check if user is dosen
   */
  protected isDosen(request: any): boolean {
    return this.getUserRole(request) === Role.DOSEN;
  }

  /**
   * Check if user is mahasiswa
   */
  protected isMahasiswa(request: any): boolean {
    return this.getUserRole(request) === Role.MAHASISWA;
  }

  /**
   * Generic GET endpoint untuk mendapatkan semua resources
   * Override method ini di child controller untuk custom logic
   */
  @Get()
  async findAll(@Request() req, @Query() query?: any) {
    // Implementasi di child controller
    throw new Error('Method not implemented');
  }

  /**
   * Generic GET endpoint untuk mendapatkan single resource by ID
   * Override method ini di child controller untuk custom logic
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    // Implementasi di child controller
    throw new Error('Method not implemented');
  }

  /**
   * Generic POST endpoint untuk create resource
   * Override method ini di child controller untuk custom logic
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: any, @Request() req) {
    // Implementasi di child controller
    throw new Error('Method not implemented');
  }

  /**
   * Generic PUT endpoint untuk update resource
   * Override method ini di child controller untuk custom logic
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Request() req) {
    // Implementasi di child controller
    throw new Error('Method not implemented');
  }

  /**
   * Generic DELETE endpoint untuk delete resource
   * Override method ini di child controller untuk custom logic
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req) {
    // Implementasi di child controller
    throw new Error('Method not implemented');
  }

  /**
   * Helper untuk membuat endpoint yang hanya accessible oleh admin
   */
  @Get()
  @Roles(Role.ADMIN)
  async adminOnly(@Request() req) {
    // Implementasi di child controller
    throw new Error('Method not implemented');
  }

  /**
   * Helper untuk membuat endpoint yang accessible oleh dosen dan admin
   */
  @Get()
  @Roles(Role.ADMIN, Role.DOSEN)
  async instructorOnly(@Request() req) {
    // Implementasi di child controller
    throw new Error('Method not implemented');
  }

  /**
   * Helper untuk membuat endpoint yang accessible oleh mahasiswa
   */
  @Get()
  @Roles(Role.MAHASISWA)
  async studentOnly(@Request() req) {
    // Implementasi di child controller
    throw new Error('Method not implemented');
  }
}
