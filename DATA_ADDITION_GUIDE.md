# Panduan Penambahan Data yang Disederhanakan

🎯 **Tujuan**: Menyederhanakan proses penambahan data/resource baru dalam proyek E-Course dengan sistem hybrid approach (Base Class Pattern + CLI Generator).

---

## 📋 Overview

Sistem ini menghilangkan kompleksitas penambahan data baru dengan menyediakan:

1. **Base Classes** - Class dengan logic common yang bisa di-extend
2. **Custom Decorators** - Decorator siap pakai untuk validasi DTO
3. **CLI Generator** - Tool otomatis untuk generate scaffold kode
4. **Standarisasi** - Pattern yang konsisten di seluruh proyek

---

## 🚀 Cara Cepat (Recommended)

### Method 1: Menggunakan CLI Generator (Paling Mudah)

Gunakan CLI generator untuk otomatis membuat semua file yang diperlukan:

```bash
# Masuk ke directory backend
cd backend

# Generate resource baru
ts-node scripts/generate-resource.ts --name=ResourceName --fields="field1:string:required,field2:number,field3:date"

# Contoh: Generate Announcement resource
ts-node scripts/generate-resource.ts --name=Announcement --fields="title:string:required,content:text:required,courseId:string" --hasCourse=true
```

**Hasil**: CLI akan otomatis membuat:
- ✅ `src/announcement/dto/create-announcement.dto.ts`
- ✅ `src/announcement/dto/update-announcement.dto.ts`
- ✅ `src/announcement/announcement.service.ts`
- ✅ `src/announcement/announcement.controller.ts`
- ✅ `src/announcement/announcement.module.ts`

### Method 2: Manual dengan Base Classes (Lebih Fleksibel)

Jika butuh kontrol lebih, gunakan base classes secara manual:

#### 1. Buat DTO dengan Custom Decorators

```typescript
// src/your-resource/dto/create-your-resource.dto.ts
import { 
  RequiredString, 
  DescriptionField, 
  RequiredDate, 
  IdField,
  OptionalNumber 
} from '../../common/base/dto.decorators';

export class CreateYourResourceDto {
  @RequiredString(200)
  title!: string;

  @DescriptionField(5000)
  description?: string;

  @RequiredDate()
  startDate!: string;

  @OptionalNumber(0, 100)
  maxScore?: number;

  @IdField()
  courseId?: string;
}
```

#### 2. Buat Service yang Extend BaseService

```typescript
// src/your-resource/your-resource.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateYourResourceDto } from './dto/create-your-resource.dto';
import { UpdateYourResourceDto } from './dto/update-your-resource.dto';
import { Role } from '@prisma/client';
import { BaseService } from '../common/base/base.service';

@Injectable()
export class YourResourceService extends BaseService<any> {
  constructor(private prisma: PrismaService) {
    super(prisma);
  }

  async create(userId: string, userRole: Role, dto: CreateYourResourceDto) {
    // Permission check otomatis dari base class
    this.checkRoleAccess(userRole, [Role.ADMIN, Role.DOSEN]);

    // Course access check otomatis
    if (dto.courseId) {
      await this.checkCourseAccess(dto.courseId, userId, userRole);
    }

    // Create dengan response formatting otomatis
    const resource = await this.prisma.yourResource.create({
      data: dto,
    });

    return this.formatResponse(resource, 'Resource created successfully');
  }

  async findOne(id: string, userId: string, userRole: Role) {
    // Find dengan error handling otomatis
    const resource = await this.findById(
      id,
      this.prisma.yourResource,
      {},
      'Resource not found'
    );

    // Add your custom logic here
    return this.formatResponse(resource, 'Resource retrieved successfully');
  }

  // Method lainnya...
}
```

#### 3. Buat Controller yang Extend BaseController

```typescript
// src/your-resource/your-resource.controller.ts
import { Controller, Post, Body, Request } from '@nestjs/common';
import { YourResourceService } from './your-resource.service';
import { CreateYourResourceDto } from './dto/create-your-resource.dto';
import { BaseController } from '../common/base/base.controller';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('your-resource')
export class YourResourceController extends BaseController {
  constructor(private readonly yourResourceService: YourResourceService) {}

  @Post()
  @Roles(Role.ADMIN, Role.DOSEN)
  async create(@Body() dto: CreateYourResourceDto, @Request() req) {
    // User extraction otomatis dari base class
    const userId = this.getUserId(req);
    const userRole = this.getUserRole(req);
    
    return this.yourResourceService.create(userId, userRole, dto);
  }

  // Method lainnya...
}
```

---

## 📚 Custom Decorators Tersedia

### String Decorators
```typescript
@RequiredString(maxLength)    // String yang wajib diisi
@OptionalString(maxLength)     // String opsional
@DescriptionField(maxLength)  // Deskripsi panjang (default 2000)
@LearningObjectivesField(maxLength) // Learning objectives (default 5000)
```

### ID Decorators
```typescript
@IdField()           // ID yang wajib (UUID validation)
@OptionalIdField()   // ID opsional (UUID validation)
```

### Number Decorators
```typescript
@RequiredNumber(min, max)  // Number yang wajib
@OptionalNumber(min, max) // Number opsional
```

### Date Decorators
```typescript
@RequiredDate()   // Date string yang wajib
@OptionalDate()   // Date string opsional
```

### Other Decorators
```typescript
@BooleanField()     // Boolean field
@ColorField()       // Hex color field
```

---

## 🔧 BaseService Methods

### Permission Checking
```typescript
this.checkRoleAccess(userRole, [Role.ADMIN, Role.DOSEN]);
this.checkOwnershipOrAdmin(resourceOwnerId, userId, userRole);
await this.checkCourseAccess(courseId, userId, userRole);
```

### Response Formatting
```typescript
this.formatResponse(data, message);
```

### Data Validation
```typescript
this.isValidUUID(id);
this.sanitizeOptionalId(id);
this.parseDate(dateString, fieldName);
this.validateDateRange(startTime, endTime);
```

### Generic CRUD Operations
```typescript
await this.findById(id, model, include, errorMessage);
await this.findAll(model, options);
await this.createResource(model, data, include, successMessage);
await this.updateResource(id, model, data, include, successMessage);
await this.deleteResource(id, model, successMessage);
```

### Helper Functions
```typescript
await this.resourceExists(model, where);
await this.getCourseEnrollments(courseId);
await this.sendNotification(notificationService, options);
await this.createCalendarEvent(calendarService, createMethod, resourceId);
```

---

## 🎮 BaseController Methods

### User Extraction
```typescript
this.getUserFromRequest(req);     // { id, email, role }
this.getUserId(req);              // string
this.getUserRole(req);            // Role enum
this.isAdmin(req);                // boolean
this.isDosen(req);                // boolean
this.isMahasiswa(req);           // boolean
```

### Role-Based Access
```typescript
@Roles(Role.ADMIN)                    // Hanya admin
@Roles(Role.ADMIN, Role.DOSEN)        // Admin dan dosen
@Roles(Role.MAHASISWA)               // Hanya mahasiswa
```

---

## 📝 CLI Generator Options

### Basic Usage
```bash
ts-node scripts/generate-resource.ts --name=ResourceName --fields="field1:type,field2:type"
```

### Field Types
- `string` - Text field
- `number` - Numeric field
- `date` - Date string field
- `boolean` - Boolean field

### Field Modifiers
- `:required` - Field wajib diisi
- `:optional` - Field opsional (default)

### Additional Options
- `--hasCourse=true` - Include course relation
- `--hasUser=true` - Include user relation

### Examples

```bash
# Simple resource
ts-node scripts/generate-resource.ts --name=Announcement --fields="title:string:required,content:text:required"

# Resource with course relation
ts-node scripts/generate-resource.ts --name=Assignment --fields="title:string:required,deadline:date:required,courseId:string" --hasCourse=true

# Resource with multiple field types
ts-node scripts/generate-resource.ts --name=Exam --fields="title:string:required,startTime:date:required,duration:number:required,maxScore:number,published:boolean"

# Resource with user relation
ts-node scripts/generate-resource.ts --name=UserProfile --fields="bio:text,phoneNumber:string" --hasUser=true
```

---

## ✅ Workflow Lengkap

### Step 1: Generate Resource (CLI)
```bash
ts-node scripts/generate-resource.ts --name=YourResource --fields="field1:string:required,field2:number"
```

### Step 2: Update Prisma Schema
```prisma
// prisma/schema.prisma
model YourResource {
  id       String @id @default(cuid())
  field1   String
  field2   Int?
  courseId String?
  course   Course? @relation(fields: [courseId], references: [id])
  
  @@map("your_resources")
}
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Run Migration
```bash
npx prisma migrate dev --name add_your_resource
```

### Step 5: Register Module
```typescript
// src/app.module.ts
import { YourResourceModule } from './your-resource/your-resource.module';

@Module({
  imports: [
    // ... other modules
    YourResourceModule,
  ],
  // ...
})
export class AppModule {}
```

### Step 6: Test Endpoints
```bash
# Start server
npm run start:dev

# Test endpoints
POST   /api/your-resource     # Create
GET    /api/your-resource     # Get all
GET    /api/your-resource/:id # Get by ID
PUT    /api/your-resource/:id # Update
DELETE /api/your-resource/:id # Delete
```

---

## 🎯 Best Practices

### 1. Gunakan CLI Generator untuk Resource Baru
- Lebih cepat dan konsisten
- Mengikuti pattern yang sudah terbukti
- Mengurangi human error

### 2. Custom Sesuai Kebutuhan
- Setelah generate, custom logic sesuai kebutuhan spesifik
- Base classes menyediakan foundation, bukan menggantikan sepenuhnya

### 3. Ikuti Naming Convention
- Resource name: PascalCase (e.g., `Announcement`)
- Service name: camelCase (e.g., `announcementService`)
- DTO name: PascalCase + suffix (e.g., `CreateAnnouncementDto`)

### 4. Validasi yang Konsisten
- Gunakan custom decorators untuk validasi yang konsisten
- Jangan gunakan `any` type jika bisa dihindari

### 5. Error Handling
- Gunakan exception dari NestJS (`NotFoundException`, `ForbiddenException`, dll)
- Berikan pesan error yang jelas dan helpful

---

## 🔍 Troubleshooting

### Issue: "Module not found"
**Solution**: Pastikan module sudah di-import di `app.module.ts`

### Issue: "Prisma client not generated"
**Solution**: Jalankan `npx prisma generate` setelah update schema

### Issue: "Permission denied"
**Solution**: Pastikan user memiliki role yang sesuai di database

### Issue: "UUID validation failed"
**Solution**: Gunakan `@IdField()` atau `@OptionalIdField()` decorator

---

## 📞 Support

Jika mengalami masalah atau butuh bantuan:

1. Cek dokumentasi NestJS: https://docs.nestjs.com
2. Cek dokumentasi Prisma: https://www.prisma.io/docs
3. Review kode yang sudah ada sebagai referensi
4. Gunakan CLI generator sebagai template

---

## 🎉 Summary

Dengan sistem ini, penambahan data baru menjadi:

- **5x lebih cepat** dengan CLI generator
- **Konsisten** di seluruh proyek dengan base classes
- **Lebih aman** dengan permission checking otomatis
- **Lebih mudah dipelihara** dengan pattern yang jelas
- **Less boilerplate** dengan decorators siap pakai

Selamat mengembangkan! 🚀
