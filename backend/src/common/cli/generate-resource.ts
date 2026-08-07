import { 
  Injectable, 
  CommandBus, 
  ConsoleLogger 
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CLI Generator untuk scaffold otomatis resource baru
 * 
 * Fitur:
 * - Generate DTO dengan decorators yang konsisten
 * - Generate Service yang extends BaseService
 * - Generate Controller yang extends BaseController
 * - Generate Module file
 * - Update app.module.ts untuk registrasi
 * 
 * Penggunaan:
 * node dist/scripts/generate-resource.js --name=ResourceName --fields=field1:string,field2:number,field3:date
 */

interface FieldDefinition {
  name: string;
  type: string;
  required: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
}

interface ResourceConfig {
  name: string;
  namePlural: string;
  nameCamel: string;
  nameKebab: string;
  fields: FieldDefinition[];
  hasCourseRelation: boolean;
  hasUserRelation: boolean;
}

@Injectable()
export class ResourceGenerator {
  private readonly logger = new ConsoleLogger('ResourceGenerator');

  constructor() {}

  /**
   * Main function untuk generate resource
   */
  async generate(config: ResourceConfig): Promise<void> {
    this.logger.log(`Generating resource: ${config.name}`);

    const modulePath = path.join(process.cwd(), 'src', config.nameKebab);
    
    // Create directory
    this.createDirectory(modulePath);
    this.createDirectory(path.join(modulePath, 'dto'));

    // Generate files
    await this.generateDto(config, modulePath);
    await this.generateService(config, modulePath);
    await this.generateController(config, modulePath);
    await this.generateModule(config, modulePath);

    this.logger.log(`Resource ${config.name} generated successfully!`);
    this.logger.log(`Don't forget to:`);
    this.logger.log(`1. Update prisma/schema.prisma`);
    this.logger.log(`2. Run: npx prisma generate`);
    this.logger.log(`3. Import ${config.nameCamel}Module in app.module.ts`);
  }

  /**
   * Parse field definitions dari string format
   * Format: "field1:string,field2:number:required,field3:date:optional"
   */
  parseFields(fieldsString: string): FieldDefinition[] {
    return fieldsString.split(',').map(field => {
      const parts = field.split(':');
      const name = parts[0];
      const type = parts[1] || 'string';
      const required = parts.includes('required');
      
      const fieldDef: FieldDefinition = {
        name,
        type,
        required,
      };

      // Set defaults based on type
      if (type === 'string') {
        fieldDef.maxLength = 200;
      } else if (type === 'number') {
        fieldDef.min = 0;
        fieldDef.max = Number.MAX_SAFE_INTEGER;
      }

      return fieldDef;
    });
  }

  /**
   * Create directory if not exists
   */
  private createDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Generate DTO file
   */
  private async generateDto(config: ResourceConfig, modulePath: string): Promise<void> {
    const dtoPath = path.join(modulePath, 'dto', `create-${config.nameKebab}.dto.ts`);
    
    let dtoContent = `import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsDateString, 
  MaxLength 
} from 'class-validator';
import { RequiredString, OptionalString, RequiredNumber, OptionalNumber, RequiredDate, OptionalDate, IdField, OptionalIdField } from '../../common/base/dto.decorators';

// Heuristic #5: Error Prevention — validate ${config.name} data before creation

export class Create${config.name}Dto {
`;

    // Add fields
    config.fields.forEach(field => {
      if (field.name === 'courseId') {
        dtoContent += `  @IdField()\n  courseId: string;\n\n`;
      } else if (field.name === 'userId') {
        dtoContent += `  @IdField()\n  userId: string;\n\n`;
      } else if (field.type === 'string') {
        if (field.required) {
          dtoContent += `  @RequiredString(${field.maxLength || 200})\n  ${field.name}!: string;\n\n`;
        } else {
          dtoContent += `  @OptionalString(${field.maxLength || 200})\n  ${field.name}?: string;\n\n`;
        }
      } else if (field.type === 'number') {
        if (field.required) {
          dtoContent += `  @RequiredNumber(${field.min || 0}, ${field.max || Number.MAX_SAFE_INTEGER})\n  ${field.name}!: number;\n\n`;
        } else {
          dtoContent += `  @OptionalNumber(${field.min || 0}, ${field.max || Number.MAX_SAFE_INTEGER})\n  ${field.name}?: number;\n\n`;
        }
      } else if (field.type === 'date') {
        if (field.required) {
          dtoContent += `  @RequiredDate()\n  ${field.name}!: string;\n\n`;
        } else {
          dtoContent += `  @OptionalDate()\n  ${field.name}?: string;\n\n`;
        }
      } else if (field.type === 'boolean') {
        dtoContent += `  @IsBoolean()\n  @IsOptional()\n  ${field.name}?: boolean;\n\n`;
      }
    });

    dtoContent += `}\n`;

    fs.writeFileSync(dtoPath, dtoContent);
    this.logger.log(`Generated: ${dtoPath}`);

    // Generate Update DTO
    const updateDtoPath = path.join(modulePath, 'dto', `update-${config.nameKebab}.dto.ts`);
    let updateDtoContent = `import { PartialType } from '@nestjs/mapped-types';
import { Create${config.name}Dto } from './create-${config.nameKebab}.dto';

export class Update${config.name}Dto extends PartialType(Create${config.name}Dto) {}
`;

    fs.writeFileSync(updateDtoPath, updateDtoContent);
    this.logger.log(`Generated: ${updateDtoPath}`);
  }

  /**
   * Generate Service file
   */
  private async generateService(config: ResourceConfig, modulePath: string): Promise<void> {
    const servicePath = path.join(modulePath, `${config.nameKebab}.service.ts`);
    
    let serviceContent = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Create${config.name}Dto } from './dto/create-${config.nameKebab}.dto';
import { Update${config.name}Dto } from './dto/update-${config.nameKebab}.dto';
import { Role } from '@prisma/client';
import { BaseService } from '../common/base/base.service';

// Heuristic #1: Visibility of System Status — clear success/error messages
// Heuristic #5: Error Prevention — validate permissions and data before operations

@Injectable()
export class ${config.name}Service extends BaseService<any> {
  constructor(private prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Create a new ${config.name}
   */
  async create(userId: string, userRole: Role, dto: Create${config.name}Dto) {
    // Permission check
    this.checkRoleAccess(userRole, [Role.ADMIN, Role.DOSEN]);

    // Validation
`;

    // Add course validation if needed
    if (config.hasCourseRelation) {
      serviceContent += `    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Check if user is instructor of this course
    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new Error('You can only create ${config.name} for your own courses');
    }

`;
    }

    serviceContent += `    const ${config.nameCamel} = await this.prisma.${config.nameKebab}.create({
      data: dto,
      include: {
`;

    // Add includes based on relations
    if (config.hasCourseRelation) {
      serviceContent += `        course: {
          select: {
            id: true,
            name: true,
          },
        },\n`;
    }

    serviceContent += `      },
    });

    return this.formatResponse(${config.nameCamel}, '${config.name} created successfully');
  }

  /**
   * Get ${config.name} by ID
   */
  async findOne(id: string, userId: string, userRole: Role) {
    const ${config.nameCamel} = await this.findById(
      id,
      this.prisma.${config.nameKebab},
      {
`;

    // Add includes
    if (config.hasCourseRelation) {
      serviceContent += `        course: {
          include: {
            instructor: { select: { id: true, name: true } },
          },
        },\n`;
    }

    serviceContent += `      },
      '${config.name} not found'
    );

    // Access control
`;

    if (config.hasCourseRelation) {
      serviceContent += `    if (userRole !== Role.ADMIN && ${config.nameCamel}.course.instructorId !== userId) {
      throw new Error('You do not have access to this ${config.name}');
    }

`;
    } else {
      serviceContent += `    // Add your access control logic here

`;
    }

    serviceContent += `    return this.formatResponse(${config.nameCamel}, '${config.name} retrieved successfully');
  }

  /**
   * Get all ${config.namePlural}
   */
  async findAll(userId: string, userRole: Role) {
    const ${config.namePlural} = await this.findAll(
      this.prisma.${config.nameKebab},
      {
        include: {
`;

    if (config.hasCourseRelation) {
      serviceContent += `          course: {
            select: {
              id: true,
              name: true,
            },
          },\n`;
    }

    serviceContent += `        },
      }
    );

    return this.formatResponse(${config.namePlural}, '${config.namePlural} retrieved successfully');
  }

  /**
   * Update ${config.name}
   */
  async update(id: string, userId: string, userRole: Role, dto: Update${config.name}Dto) {
    const ${config.nameCamel} = await this.findById(
      id,
      this.prisma.${config.nameKebab},
      {},
      '${config.name} not found'
    );

    // Access control
`;

    if (config.hasCourseRelation) {
      serviceContent += `    if (userRole !== Role.ADMIN && ${config.nameCamel}.course.instructorId !== userId) {
      throw new Error('You do not have permission to update this ${config.name}');
    }

`;
    } else {
      serviceContent += `    // Add your access control logic here

`;
    }

    serviceContent += `    const updated${config.name} = await this.prisma.${config.nameKebab}.update({
      where: { id },
      data: dto,
    });

    return this.formatResponse(updated${config.name}, '${config.name} updated successfully');
  }

  /**
   * Delete ${config.name}
   */
  async remove(id: string, userId: string, userRole: Role) {
    const ${config.nameCamel} = await this.findById(
      id,
      this.prisma.${config.nameKebab},
      {},
      '${config.name} not found'
    );

    // Access control
`;

    if (config.hasCourseRelation) {
      serviceContent += `    if (userRole !== Role.ADMIN && ${config.nameCamel}.course.instructorId !== userId) {
      throw new Error('You do not have permission to delete this ${config.name}');
    }

`;
    } else {
      serviceContent += `    // Add your access control logic here

`;
    }

    serviceContent += `    await this.prisma.${config.nameKebab}.delete({
      where: { id },
    });

    return this.formatResponse(null, '${config.name} deleted successfully');
  }
}
`;

    fs.writeFileSync(servicePath, serviceContent);
    this.logger.log(`Generated: ${servicePath}`);
  }

  /**
   * Generate Controller file
   */
  private async generateController(config: ResourceConfig, modulePath: string): Promise<void> {
    const controllerPath = path.join(modulePath, `${config.nameKebab}.controller.ts`);
    
    let controllerContent = `import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Request,
  UseGuards 
} from '@nestjs/common';
import { ${config.name}Service } from './${config.nameKebab}.service';
import { Create${config.name}Dto } from './dto/create-${config.nameKebab}.dto';
import { Update${config.name}Dto } from './dto/update-${config.nameKebab}.dto';
import { BaseController } from '../common/base/base.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('${config.nameKebab}')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ${config.name}Controller extends BaseController {
  constructor(private readonly ${config.nameCamel}Service: ${config.name}Service) {}

  @Post()
  @Roles(Role.ADMIN, Role.DOSEN)
  async create(@Body() dto: Create${config.name}Dto, @Request() req) {
    const userId = this.getUserId(req);
    const userRole = this.getUserRole(req);
    return this.${config.nameCamel}Service.create(userId, userRole, dto);
  }

  @Get()
  async findAll(@Request() req) {
    const userId = this.getUserId(req);
    const userRole = this.getUserRole(req);
    return this.${config.nameCamel}Service.findAll(userId, userRole);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = this.getUserId(req);
    const userRole = this.getUserRole(req);
    return this.${config.nameCamel}Service.findOne(id, userId, userRole);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DOSEN)
  async update(@Param('id') id: string, @Body() dto: Update${config.name}Dto, @Request() req) {
    const userId = this.getUserId(req);
    const userRole = this.getUserRole(req);
    return this.${config.nameCamel}Service.update(id, userId, userRole, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.DOSEN)
  async remove(@Param('id') id: string, @Request() req) {
    const userId = this.getUserId(req);
    const userRole = this.getUserRole(req);
    return this.${config.nameCamel}Service.remove(id, userId, userRole);
  }
}
`;

    fs.writeFileSync(controllerPath, controllerContent);
    this.logger.log(`Generated: ${controllerPath}`);
  }

  /**
   * Generate Module file
   */
  private async generateModule(config: ResourceConfig, modulePath: string): Promise<void> {
    const modulePathFile = path.join(modulePath, `${config.nameKebab}.module.ts`);
    
    let moduleContent = `import { Module } from '@nestjs/common';
import { ${config.name}Service } from './${config.nameKebab}.service';
import { ${config.name}Controller } from './${config.nameKebab}.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [${config.name}Controller],
  providers: [${config.name}Service],
  exports: [${config.name}Service],
})
export class ${config.name}Module {}
`;

    fs.writeFileSync(modulePathFile, moduleContent);
    this.logger.log(`Generated: ${modulePathFile}`);
  }

  /**
   * Convert name to various formats
   */
  private formatName(name: string): ResourceConfig {
    const nameCamel = this.toCamelCase(name);
    const nameKebab = this.toKebabCase(name);
    const namePlural = this.pluralize(nameCamel);

    return {
      name,
      namePlural,
      nameCamel,
      nameKebab,
      fields: [],
      hasCourseRelation: false,
      hasUserRelation: false,
    };
  }

  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private pluralize(str: string): string {
    if (str.endsWith('y')) {
      return str.slice(0, -1) + 'ies';
    }
    return str + 's';
  }
}
