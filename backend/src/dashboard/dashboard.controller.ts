import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('admin')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @Roles(Role.ADMIN)
  async getAdminStats() {
    return this.dashboardService.getAdminStats();
  }

  @Get('lecturer')
  @ApiOperation({ summary: 'Get lecturer dashboard statistics' })
  @Roles(Role.DOSEN)
  async getLecturerStats(@CurrentUser('sub') userId: string) {
    return this.dashboardService.getLecturerStats(userId);
  }

  @Get('student')
  @ApiOperation({ summary: 'Get student dashboard statistics' })
  @Roles(Role.MAHASISWA)
  async getStudentStats(@CurrentUser('sub') userId: string) {
    return this.dashboardService.getStudentStats(userId);
  }
}
