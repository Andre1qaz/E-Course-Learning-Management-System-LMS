# Panduan Deployment Gratis - E-Course LMS

Deployment gratis menggunakan kombinasi platform:
- **Frontend**: Vercel (Next.js)
- **Backend**: Render (NestJS)
- **Database**: Supabase (PostgreSQL)
- **Redis**: Upstash
- **Storage**: Cloudflare R2

---

## Prerequisites

1. **GitHub Account** - Untuk hosting kode dan integrasi CI/CD
2. **Vercel Account** - [vercel.com](https://vercel.com)
3. **Render Account** - [render.com](https://render.com)
4. **Supabase Account** - [supabase.com](https://supabase.com)
5. **Upstash Account** - [upstash.com](https://upstash.com)
6. **Cloudflare Account** - [cloudflare.com](https://cloudflare.com)

---

## Step 1: Setup Database (Supabase)

### 1.1 Buat Project Supabase

1. Login ke [supabase.com](https://supabase.com)
2. Klik **"New Project"**
3. Isi detail:
   - **Name**: `ecourse-lms`
   - **Database Password**: Generate password yang kuat
   - **Region**: Pilih region terdekat (misal: Singapore)
4. Klik **"Create new project"**
5. Tunggu 2-3 menit untuk setup selesai

### 1.2 Dapatkan Database Credentials

1. Buka project yang baru dibuat
2. Masuk ke **Settings → Database**
3. Copy **Connection String**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```
4. Masuk ke **Project Settings → API**
5. Copy:
   - **Project URL**: `https://[PROJECT-ID].supabase.co`
   - **anon public key**
   - **service_role secret key**

### 1.3 Setup Database Schema

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ke project
supabase link --project-ref [PROJECT-ID]

# Push schema dari Prisma
cd backend
npx prisma db push
```

---

## Step 2: Setup Redis (Upstash)

### 2.1 Buat Redis Database

1. Login ke [upstash.com](https://upstash.com)
2. Klik **"Create Database"**
3. Pilih region terdekat (misal: Singapore)
4. Klik **"Create"**

### 2.2 Dapatkan Redis Credentials

1. Buka database yang baru dibuat
2. Masuk ke **Details → REST API**
3. Copy:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**

---

## Step 3: Setup Storage (Cloudflare R2)

### 3.1 Buat R2 Bucket

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Masuk ke **R2 → Create Bucket**
3. Buat 2 buckets:
   - `ecourse-public` (untuk file publik)
   - `ecourse-private` (untuk file privat)

### 3.2 Dapatkan R2 Credentials

1. Masuk ke **R2 → Manage R2 API Tokens**
2. Klik **"Create API Token"**
3. Pilih permissions:
   - **Object Read & Write**
   - **Admin Read**
4. Copy:
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID** (dari dashboard URL)

---

## Step 4: Setup Backend (Render)

### 4.1 Push ke GitHub

```bash
# Initialize git jika belum
git init
git add .
git commit -m "Initial commit"

# Push ke GitHub
git branch -M main
git remote add origin https://github.com/username/repo.git
git push -u origin main
```

### 4.2 Deploy ke Render

1. Login ke [render.com](https://render.com)
2. Klik **"New +" → "Web Service"**
3. Connect ke GitHub repository
4. Configure:
   - **Name**: `ecourse-backend`
   - **Region**: Singapore (atau terdekat)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run start:prod`
5. **Advanced**:
   - Add Environment Variables (lihat di bawah)
6. Klik **"Create Web Service"**

### 4.3 Environment Variables untuk Backend

Tambahkan environment variables di Render dashboard:

```env
NODE_ENV=production
PORT=3001

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# Redis (Upstash)
REDIS_HOST=your-redis.upstash.io
REDIS_PORT=6379
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# JWT
JWT_SECRET=generate-with-openssl-rand-base64-32
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://your-project.vercel.app

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_PUBLIC=ecourse-public
R2_BUCKET_PRIVATE=ecourse-private
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

### 4.4 Generate Secrets

```bash
# Generate JWT Secret
openssl rand -base64 32
```

### 4.5 Tunggu Deployment Selesai

- Render akan build dan deploy backend
- Proses ini memakan waktu 5-10 menit
- Setelah selesai, copy URL backend: `https://ecourse-backend.onrender.com`

---

## Step 5: Setup Frontend (Vercel)

### 5.1 Deploy ke Vercel

1. Login ke [vercel.com](https://vercel.com)
2. Klik **"Add New" → "Project"**
3. Import GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. **Environment Variables** (lihat di bawah)
6. Klik **"Deploy"**

### 5.2 Environment Variables untuk Frontend

Tambahkan di Vercel dashboard:

```env
NEXT_PUBLIC_API_URL=https://ecourse-backend.onrender.com/api
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

### 5.3 Generate NextAuth Secret

```bash
# Generate NextAuth Secret
openssl rand -base64 32
```

### 5.4 Tunggu Deployment Selesai

- Vercel akan build dan deploy frontend
- Proses ini memakan waktu 2-5 menit
- Setelah selesai, copy URL frontend: `https://your-project.vercel.app`

---

## Step 6: Update Backend untuk R2 Integration

### 6.1 Install AWS SDK di Backend

```bash
cd backend
npm install @aws-sdk/client-s3
```

### 6.2 Update Storage Service

Buat atau update file `backend/src/storage/storage.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private publicBucket: string;
  private privateBucket: string;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.R2_ENDPOINT,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
    this.publicBucket = process.env.R2_BUCKET_PUBLIC;
    this.privateBucket = process.env.R2_BUCKET_PRIVATE;
  }

  async uploadPublicFile(key: string, body: Buffer, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.publicBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await this.s3Client.send(command);
    return `${process.env.R2_ENDPOINT}/${this.publicBucket}/${key}`;
  }

  async uploadPrivateFile(key: string, body: Buffer, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.privateBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await this.s3Client.send(command);
  }

  async getPrivateFileUrl(key: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.privateBucket,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(bucket: string, key: string) {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await this.s3Client.send(command);
  }
}
```

---

## Step 7: Database Migration

### 7.1 Run Migration di Render

1. Buka Render dashboard untuk backend
2. Masuk ke **Shell** (tab di dashboard)
3. Run commands:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (opsional, untuk demo data)
npx prisma db seed
```

---

## Step 8: Testing Deployment

### 8.1 Test Backend Health

```bash
# Test health endpoint
curl https://ecourse-backend.onrender.com/api/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":...,"environment":"production"}
```

### 8.2 Test Frontend

1. Buka URL Vercel di browser
2. Login dengan akun demo:
   - **Email**: admin@ecourse.ac.id
   - **Password**: Password123!
3. Verifikasi semua fitur berfungsi

---

## Step 9: Custom Domain (Opsional)

### 9.1 Setup Custom Domain di Vercel

1. Masuk ke Vercel dashboard
2. Masuk ke **Settings → Domains**
3. Add custom domain (misal: `ecourse.yourdomain.com`)
4. Update DNS records sesuai instruksi Vercel

### 9.2 Update Environment Variables

Update `NEXTAUTH_URL` dan `FRONTEND_URL` dengan custom domain.

---

## Monitoring & Maintenance

### Health Check

Backend health check: `https://ecourse-backend.onrender.com/api/health`

### Render Limitations (Free Tier)

- **Sleeps after 15 minutes** inactivity
- **Cold start**: 30-60 seconds saat pertama kali diakses
- **750 hours/month** total runtime

### Vercel Limitations (Free Tier)

- **100GB bandwidth/month**
- **6,000 build minutes/month**
- **Unlimited deployments**

### Supabase Limitations (Free Tier)

- **500MB database**
- **2GB bandwidth/month**
- **2 concurrent connections**

### Upstash Limitations (Free Tier)

- **10,000 commands/day**
- **256MB storage**

### Cloudflare R2 Limitations (Free Tier)

- **10GB storage**
- **Unlimited egress (Class A operations)**

---

## Troubleshooting

### Backend tidak bisa connect ke database

**Problem**: Connection timeout ke Supabase

**Solution**:
1. Pastikan DATABASE_URL benar
2. Check Supabase project status
3. Verify IP tidak diblokir (Supabase allow all IPs di free tier)

### Redis connection error

**Problem**: Gagal connect ke Upstash Redis

**Solution**:
1. Verify UPSTASH_REDIS_REST_URL dan token
2. Check Upstash dashboard untuk status
3. Pastikan environment variables benar

### File upload gagal

**Problem**: Gagal upload ke R2

**Solution**:
1. Verify R2 credentials
2. Check bucket permissions
3. Pastikan R2_ENDPOINT benar

### Frontend tidak bisa connect ke backend

**Problem**: CORS error atau connection refused

**Solution**:
1. Pastikan NEXT_PUBLIC_API_URL benar
2. Check backend CORS configuration
3. Verify backend sudah running (bukan sleep state)

---

## Cost Summary (Free Tier)

| Service | Free Tier Limit | Cost if Exceeded |
|---------|----------------|------------------|
| Vercel | 100GB bandwidth, 6,000 build min | $20/month |
| Render | 750 hours/month, 512MB RAM | $7/month |
| Supabase | 500MB DB, 2GB bandwidth | $25/month |
| Upstash | 10K commands/day, 256MB | $0.20/10K commands |
| Cloudflare R2 | 10GB storage, unlimited egress | $0.015/GB |

**Total**: Gratis untuk development dan demo
**Production**: Estimasi $50-100/month jika melebihi limits

---

## Next Steps

1. **Setup CI/CD**: GitHub Actions untuk automated testing
2. **Monitoring**: Setup Sentry untuk error tracking
3. **Backup**: Automated backup database dari Supabase
4. **Custom Domain**: Setup domain sendiri untuk branding
5. **Email Service**: Setup Resend untuk email notifications

---

## Support

Jika mengalami masalah:
- Check logs di Render dashboard
- Check logs di Vercel dashboard
- Review environment variables
- Verify semua services running
