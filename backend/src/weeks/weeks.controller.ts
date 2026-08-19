import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { WeeksService } from './weeks.service';
import { CreateWeekDto } from './dto/create-week.dto';
import { UpdateWeekDto } from './dto/update-week.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('weeks')
@Controller('courses/:courseId/weeks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WeeksController {
  constructor(private readonly weeksService: WeeksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all weeks for a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  findAll(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.weeksService.findByCourse(courseId, userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific week' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Week ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.weeksService.findOne(id, userId, role);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({ summary: 'Create a new week (Admin/Dosen only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateWeekDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.weeksService.create(courseId, dto, userId, role);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({ summary: 'Update a week (Admin/Dosen only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Week ID' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWeekDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.weeksService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({ summary: 'Delete a week (Admin/Dosen only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Week ID' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.weeksService.remove(id, userId, role);
  }

  @Post('reorder')
  @Roles(Role.ADMIN, Role.DOSEN)
  @ApiOperation({ summary: 'Reorder weeks (Admin/Dosen only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  reorder(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: { weekOrders: { id: string; order: number }[] },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.weeksService.reorder(courseId, body.weekOrders, userId, role);
  }
}
