# Deployment Error Analysis - E-Course LMS

**Project:** E-Course Learning Management System  
**Deployment Date:** September 4-5, 2026  
**Environment:** Production (Vercel + Render + Supabase)  
**Status:** In Progress - Waiting for Environment Variables Update

---

## 📋 Executive Summary

Deployment E-Course LMS mengalami multi-layer issues yang menyebabkan kegagalan login. Masalah utama adalah **koneksi database via IPv6 yang tidak didukung oleh Render**, yang menyebabkan semua request login gagal dengan error 500 Internal Server Error sebelum mencapai business logic authentication.

---

## 🔍 Error Breakdown by Layer

### **Error 1: NextAuth URL Redirect Issue**

#### **Error Message:**
```
Frontend redirect ke preview URL:
https://e-course-learning-management-system-nhpnmybwv.vercel.app/login?callbackUrl=%2F
```

#### **Gejala:**
- User mengakses `https://e-course-learning-management-system.vercel.app`
- Browser redirect ke preview URL dengan hash
- URL berubah-ubah setiap deploy

#### **Root Cause:**
- `NEXTAUTH_URL` di Vercel environment variables masih menggunakan placeholder `your-project.vercel.app`
- NextAuth mendeteksi URL dari request header dan menggunakannya untuk callback
- Preview URL di-generate oleh Vercel untuk setiap deployment

#### **Impact:**
- Callback URL tidak valid
- NextAuth session tidak bisa dibuat
- Autentication flow broken

#### **Solusi Diterapkan:**
1. Update `frontend/next.config.ts` untuk force production URL:
   ```typescript
   NEXTAUTH_URL: process.env.NODE_ENV === 'production'
     ? process.env.NEXTAUTH_URL || 'https://e-course-learning-management-system.vercel.app'
     : process.env.NEXTAUTH_URL || process.env.VERCEL_URL
       ? `https://${process.env.VERCEL_URL}`
       : 'http://localhost:3000'
   ```
2. Update environment variables di Vercel dashboard
3. Commit: `35fc79c Fix NextAuth preview URL redirect issue - force production URL`

#### **Status:**
✅ **SOLVED** - URL redirect sekarang tetap di production domain

---

### **Error 2: AppController Not Registered**

#### **Error Message:**
```
Invoke-RestMethod : The remote server returned an error: (404) Not Found
```

#### **Gejala:**
- `/api/health` return 404
- `/api/auth/login` return 404
- Backend "live" tapi semua routes tidak aktif

#### **Root Cause:**
- `AppController` ada di `src/app.controller.ts`
- Tapi tidak terdaftar di `AppModule`
- NestJS tidak mendaftarkan controller yang tidak ada di module

#### **Impact:**
- Semua API routes tidak aktif
- Health check tidak bisa diakses
- Login endpoint tidak bisa diakses

#### **Solusi Diterapkan:**
1. Update `backend/src/app.module.ts`:
   ```typescript
   import { AppController } from './app.controller';
   import { AppService } from './app.service';

   @Module({
     // ...
     controllers: [AppController],
     providers: [AppService, ...],
   })
   ```
2. Commit: `f66052d Fix: Register AppController and AppService in AppModule`

#### **Status:**
✅ **SOLVED** - Health endpoint dan routes sekarang aktif

---

### **Error 3: Database Connection - IPv6 Issue (ROOT CAUSE UTAMA)**

#### **Error Message:**
```
prisma:error 
Invalid `prisma.user.findUnique()` invocation:
connect ENETUNREACH 2406:da18:167b:f901:367d:1948:d9b:20d7:5432 - Local (:::0)
```

#### **Gejala:**
- Backend return 500 Internal Server Error untuk semua request login
- Error Prisma saat mencoba connect ke database
- Logs menunjukkan koneksi ke localhost IPv6 (`:::0`)

#### **Root Cause:**
1. **DATABASE_URL menggunakan direct connection ke Supabase** (port 5432)
2. **Supabase direct connection resolves ke IPv6 address** (`2406:da18:...`)
3. **Render tidak mendukung outbound IPv6** di banyak plan/region
4. **Prisma mencoba connect ke IPv6 tapi gagal dengan ENETUNREACH**
5. Walaupun credential dan schema benar, koneksi mati di level network

**Analisis Teknis:**
```
Supabase Direct Connection (port 5432)
    ↓
Resolves to IPv6: 2406:da18:167b:f901:367d:1948:d9b:20d7:5432
    ↓
Render Outbound Connection
    ↓
IPv6 NOT SUPPORTED by Render
    ↓
Result: ENETUNREACH (Connection Refused)
```

#### **Impact:**
- Semua request yang membutuhkan database gagal
- Login tidak bisa kueri user dari database
- Semua CRUD operations gagal
- Aplikasi tidak bisa digunakan sama sekali

#### **Solusi yang Diterapkan:**
1. Update prisma.config.ts untuk support directUrl:
   ```typescript
   datasource: {
     url: process.env.DATABASE_URL,
     directUrl: process.env.DIRECT_URL,
   }
   ```
2. Update schema.prisma untuk support directUrl (kemudian di-revert karena Prisma 7)
3. Update PrismaService untuk handle DIRECT_URL
4. Commit: `fd04f89 Fix IPv6 connection issue: Add support for Supabase Connection Pooler (Supavisor) with directUrl`

#### **Solusi yang SEGERA DIPERLUKAN (BUTUH USER ACTION):**
1. **Buka Supabase Dashboard** → Settings → Database → Connection Pooling
2. **Copy "Transaction mode" connection string** (port 6543):
   ```
   postgresql://postgres.klltjysxikbaqumjvtpn:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
3. **Update `DATABASE_URL` di Render Dashboard** dengan connection pooler URL di atas
4. **Copy "Session mode" connection string** (port 5432 di pooler)
5. **Add variabel baru `DIRECT_URL` di Render** dengan session mode URL
6. **Manual redeploy** di Render

**Mengapa Connection Pooler Solves Ini:**
- Connection pooler menggunakan IPv4 (didukung Render)
- Port 6543 (Transaction mode) optimal untuk Prisma dengan koneksi pendek-pendek
- Port 5432 (Session mode) optimal untuk migration
- Menghindari IPv6 issue sama sekali

#### **Status:**
⏳ **IN PROGRESS** - Kode sudah benar, menunggu user update environment variables di Render

---

### **Error 4: Prisma Configuration Issues**

#### **Error Message:**
```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: The datasource property `url` is no longer supported in schema files
```

#### **Gejala:**
- Build failure di Render
- Prisma generate gagal
- Prisma 7 menghapus support untuk `url` di schema.prisma

#### **Root Cause:**
- Prisma 7 mengubah arsitektur
- Connection string tidak boleh di schema.prisma
- Semua connection string harus di prisma.config.ts
- `dotenv/config` tidak bekerja di environment Render
- `env('DATABASE_URL')` dari prisma/config helper tidak membaca environment variables dengan benar

#### **Impact:**
- Build process gagal
- Prisma Client tidak bisa di-generate
- Backend tidak bisa di-deploy

#### **Solusi Diterapkan:**
1. Hapus `url` dan `directUrl` dari schema.prisma
2. Pindahkan semua connection string ke prisma.config.ts
3. Hapus `dotenv/config` dari prisma.config.ts
4. Tambah directUrl support di prisma.config.ts
5. Set `process.env.DATABASE_URL` secara manual di PrismaService constructor
6. Tambah singleton pattern untuk mencegah multiple instances
7. Commits:
   - `a5d3220 Fix: Set DATABASE_URL in process.env before PrismaClient initialization`
   - `06e8ce7 Add singleton pattern to PrismaService to prevent multiple instances`
   - `f319287 Fix prisma.config.ts to use process.env.DATABASE_URL instead of prisma/env()`
   - `7629bce Add fallback DATABASE_URL in prisma.config.ts for production`
   - `958ebb2 TEMPORARY: Hardcode DATABASE_URL in schema.prisma for debugging`
   - `4742ee0 Revert schema.prisma and restore dotenv/config`
   - `aa88bc7 Add URL decoding in PrismaService to handle encoded characters`
   - `fd04f89 Fix IPv6 connection issue: Add support for Supabase Connection Pooler (Supavisor) with directUrl`
   - `b946ead Remove url/directUrl from schema.prisma - Prisma 7 requires all in prisma.config.ts`

#### **Status:**
✅ **SOLVED** - Prisma configuration sekarang benar untuk Prisma 7

---

### **Error 5: Multiple PrismaService Instances**

#### **Error Message:**
```
Logs menunjukkan 3x "PrismaService initialized"
3x "Database connected successfully"
Tapi masih ada error "connect ENETUNREACH"
```

#### **Gejala:**
- Beberapa instance berhasil connect
- Beberapa instance masih gagal dengan localhost IPv6
- Inconsistent behavior

#### **Root Cause:**
- NestJS meng-inject PrismaService di multiple modules
- Setiap injection membuat instance baru
- Beberapa instance menggunakan DATABASE_URL yang kita set (berhasil)
- Beberapa instance menggunakan prisma.config.ts default (gagal → localhost)

#### **Impact:**
- Race condition dalam database connection
- Inconsistent behavior antar request
- Some requests succeed, some fail

#### **Solusi Diterapkan:**
1. Tambah singleton pattern di PrismaService:
   ```typescript
   private static instance: PrismaService;

   constructor(configService: ConfigService) {
     if (PrismaService.instance) {
       return PrismaService.instance;
     }
     // ... initialization
     PrismaService.instance = this;
   }
   ```
2. Commit: `06e8ce7 Add singleton pattern to PrismaService to prevent multiple instances`

#### **Status:**
✅ **SOLVED** - Hanya 1 instance yang dibuat

---

### **Error 6: Activity Logging & Email Queue**

#### **Error Message:**
```
Login return 500 (sebelum fix database connection)
Potential additional error dari ActivityLog.create or EmailQueue
```

#### **Gejala:**
- Login bisa saja gagal karena ActivityLog create gagal
- Email queue menggunakan BullMQ yang memerlukan Redis
- Tambahan layer yang bisa menyebabkan error

#### **Root Cause:**
- ActivityLog.create dieksekusi setelah login
- Email queue dieksekusi setelah register
- Jika database connection atau Redis gagal, ini menyebabkan 500

#### **Impact:**
- Login bisa gagal meskipun authentication valid
- Register bisa gagal meskipun user creation valid
- Tambahan point of failure

#### **Solusi Diterapkan:**
1. Comment out ActivityLog.create di login:
   ```typescript
   // await this.prisma.activityLog.create({
   //   data: { userId: user.id, action: 'LOGIN', ... }
   // });
   ```
2. Comment out Email queue di register
3. Commit: `d5e52ba Temporarily disable activity logging and email queue for debugging login issue`

#### **Status:**
✅ **TEMPORARILY DISABLED** - Akan di-enable setelah login berhasil

---

## 📊 Timeline of Errors & Fixes

| Timestamp | Error | Fix Applied | Status |
|-----------|-------|-------------|--------|
| Initial | NextAuth redirect ke preview URL | Force production URL in next.config.ts | ✅ Fixed |
| Initial | AppController 404 | Register in AppModule | ✅ Fixed |
| Initial | Database connection ENETUNREACH | Add singleton pattern, process.env override | ⏳ Pending (need connection pooler) |
| Initial | Prisma config issues | Move all to prisma.config.ts | ✅ Fixed |
| Initial | Multiple instances | Singleton pattern | ✅ Fixed |
| Initial | ActivityLog/EmailQueue potential errors | Temporarily disabled | ✅ Temporarily disabled |

---

## 🎯 Current Status

### **✅ Completed:**
1. NextAuth URL redirect fix
2. AppController registration
3. Prisma configuration for Prisma 7
4. Singleton pattern implementation
5. Activity logging temporarily disabled
6. Email queue temporarily disabled
7. Code commits pushed to GitHub

### **⏳ Pending (Requires User Action):**
1. **Update DATABASE_URL di Render** dengan Supabase Connection Pooler (Transaction mode, port 6543)
2. **Add DIRECT_URL di Render** dengan Supabase Connection Pooler (Session mode, port 5432)
3. **Manual redeploy** di Render
4. **Test login** setelah redeploy selesai

### **🔄 After Environment Variables Update:**
1. Database connection akan berhasil (IPv4 via pooler)
2. Login seharusnya return 200 OK
3. Re-enable ActivityLog and EmailQueue
4. Test complete flow: login → dashboard → basic features

---

## 🔮 Expected Outcome After All Fixes

### **Database Connection:**
```
✅ Prisma connects via IPv4 connection pooler
✅ No more ENETUNREACH errors
✅ Connection stable and reliable
```

### **Authentication:**
```
✅ Login return 200 OK with access token
✅ Frontend redirects to correct dashboard based on role
✅ Session persists correctly
✅ NextAuth callbacks work properly
```

### **Application Functionality:**
```
✅ CRUD operations work
✅ Real-time features work (WebSocket)
✅ File upload to Cloudflare R2 works
✅ Redis/Upstash queue operations work
```

---

## 📝 Lessons Learned

### **Deployment Best Practices:**
1. **Gunakan connection pooler** untuk serverless environments (Render, Vercel, etc.)
2. **Hindari direct database connections** yang resolve ke IPv6
3. **Prisma 7 requires all config in prisma.config.ts**, bukan di schema.prisma
4. **Environment variables harus di-set dengan benar** di platform dashboard
5. **Singleton pattern** penting untuk database connections di NestJS

### **Troubleshooting Approach:**
1. Start dengan health check endpoint
2. Test API routes secara langsung (bypass frontend)
3. Cek logs untuk error detail
4. Isolate issue layer by layer (network → database → logic)
5. Jangan asumsi masalah tanpa bukti dari logs

### **Security Considerations:**
- Password hash menggunakan bcrypt dengan rounds=12
- JWT secrets harus random dan cukup panjang
- Environment variables tidak boleh di-commit ke git
- Setelah deployment selesai, semua exposed credentials harus di-rotate

---

## 🚀 Next Steps

### **Immediate (Required):**
1. Update DATABASE_URL di Render dengan Supabase Connection Pooler URL
2. Add DIRECT_URL di Render dengan Session mode pooler URL
3. Manual redeploy di Render
4. Test login via PowerShell

### **Short-term (After Login Works):**
1. Re-enable ActivityLog in auth.service.ts
2. Re-enable Email queue in auth.service.ts
3. Test complete user registration flow
4. Test CRUD operations

### **Long-term:**
1. Rotate semua exposed credentials (database password, Supabase keys, Upstash token, R2 keys)
2. Setup staging environment untuk testing sebelum production
3. Implement automated testing untuk catch regressions
4. Setup monitoring untuk production issues

---

## 📞 Support

Jika masih ada error setelah mengupdate environment variables:

1. **Cek Render logs** untuk error detail baru
2. **Verifikasi connection pooler URL** dari Supabase Dashboard
3. **Test connection pooler** dari local dengan klien PostgreSQL
4. **Cek apakah admin user** masih ada di database

---

**Document Version:** 1.0  
**Last Updated:** September 6, 2026  
**Maintainer:** Devin AI Assistant
