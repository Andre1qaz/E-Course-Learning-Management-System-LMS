# Deployment Checklist - E-Course LMS

## Phase 1: Register Accounts & Setup Services

### ✅ Step 1: GitHub Repository
- [ ] **Lakukan**: Pastikan repository GitHub sudah ada (jika belum, buat di https://github.com)
- [ ] **Catat**: Repository URL yang sudah ada: `https://github.com/[USERNAME]/[REPO-NAME].git`
- [ ] **Lakukan**: Pastikan repository sudah memiliki branch `main`

---

### ✅ Step 2: Supabase (Database)
- [ ] **Lakukan**: Register di https://supabase.com
- [ ] **Lakukan**: Buat project baru:
  - Name: `ecourse-lms`
  - Database Password: (generate password kuat)
  - Region: Singapore (atau terdekat)
- [ ] **Catat** dari Settings → Database:
  - Connection String: `postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres`
- [ ] **Catat** dari Project Settings → API:
  - Project URL: `https://[PROJECT-ID].supabase.co`
  - anon public key: `eyJhbGci...`
  - service_role secret key: `eyJhbGci...`

---

### ✅ Step 3: Upstash (Redis)
- [ ] **Lakukan**: Register di https://upstash.com
- [ ] **Lakukan**: Buat Redis Database:
  - Region: Singapore (atau terdekat)
- [ ] **Catat** dari Details → REST API:
  - UPSTASH_REDIS_REST_URL: `https://your-redis.upstash.io`
  - UPSTASH_REDIS_REST_TOKEN: `AXXX...`

---

  ### ✅ Step 4: Cloudflare R2 (Storage)
  - [ ] **Lakukan**: Register di https://cloudflare.com
  - [ ] **Lakukan**: Buat 2 R2 buckets:
    - `ecourse-public` (untuk file publik)
    - `ecourse-private` (untuk file privat)
  - [ ] **Lakukan**: Create API Token:
    - Masuk ke R2 → Manage R2 API Tokens
    - Permissions: Object Read & Write, Admin Read
  - [ ] **Catat**:
    - Access Key ID: `XXXXX`
    - Secret Access Key: `XXXXX`
    - Account ID: `XXXXX` (dari dashboard URL)
    - R2 Endpoint: `https://[ACCOUNT-ID].r2.cloudflarestorage.com`

---

### ✅ Step 5: Vercel (Frontend)
- [ ] **Lakukan**: Register di https://vercel.com
- [ ] **Lakukan**: Connect GitHub account ke Vercel
- [ ] **Generate NextAuth Secret**:
  ```bash
  openssl rand -base64 32
  ```
- [ ] **Catat**: NextAuth Secret: `XXXXX...`

---

### ✅ Step 6: Render (Backend)
- [ ] **Lakukan**: Register di https://render.com
- [ ] **Lakukan**: Connect GitHub account ke Render
- [ ] **Generate JWT Secret**:
  ```bash
  openssl rand -base64 32
  ```
- [ ] **Catat**: JWT Secret: `XXXXX...`

---

## Phase 2: Collect All Credentials

### 📋 Copy-Paste Template untuk Devin:

Kirimkan informasi berikut kepada Devin dalam format ini:

```yaml
# GitHub Repository
GITHUB_REPO_URL: https://github.com/username/repo.git

# Supabase Database
SUPABASE_DATABASE_URL: postgresql://postgres:PASSWORD@db.PROJECT-ID.supabase.co:5432/postgres
SUPABASE_PROJECT_URL: https://PROJECT-ID.supabase.co
SUPABASE_ANON_KEY: eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY: eyJhbGci...

# Upstash Redis
UPSTASH_REDIS_REST_URL: https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN: AXXX...

# Cloudflare R2
R2_ACCOUNT_ID: XXXXX
R2_ACCESS_KEY_ID: XXXXX
R2_SECRET_ACCESS_KEY: XXXXX
R2_ENDPOINT: https://XXXXX.r2.cloudflarestorage.com
R2_BUCKET_PUBLIC: ecourse-public
R2_BUCKET_PRIVATE: ecourse-private

# Secrets
JWT_SECRET: XXXXX...
NEXTAUTH_SECRET: XXXXX...

# (URL akan diisi setelah deployment)
BACKEND_URL: (akan diisi setelah deploy Render)
FRONTEND_URL: (akan diisi setelah deploy Vercel)
```

---

## Phase 3: Deployment Flow

### 🔄 Alur yang akan Devin jalankan:

1. **Setup Environment Variables**
   - Devin akan membuat file `.env` di backend dan frontend
   - Devin akan install dependencies yang diperlukan

2. **Push to GitHub**
   - Devin akan inisialisasi git
   - Devin akan commit dan push code ke repository Anda

3. **Update Code for Cloud Integration**
   - Devin akan install `@aws-sdk/client-s3` untuk R2
   - Devin akan update storage service untuk Cloudflare R2
   - Devin akan verify semua konfigurasi deployment

4. **Database Migration**
   - Devin akan setup Prisma untuk Supabase
   - Devin akan run database migrations

5. **Testing Local**
   - Devin akan test apakah konfigurasi benar
   - Devin akan verify environment variables

6. **Anda Deploy ke Cloud** (Manual)
   - Deploy backend ke Render
   - Deploy frontend ke Vercel
   - Update environment variables di kedua platform

7. **Final Testing**
   - Devin akan test health endpoints
   - Devin akan verify integrasi antar services

---

## Phase 4: Manual Deployment Steps (Setelah Devin selesai)

### 🚀 Deploy Backend ke Render:

1. Login ke Render → New + → Web Service
2. Connect ke GitHub repository
3. Configure:
   - Name: `ecourse-backend`
   - Region: Singapore
   - Branch: `main`
   - Runtime: Node
   - Build Command: `npm install && npm run prisma:generate && npm run build`
   - Start Command: `npm run start:prod`
4. Add Environment Variables (dari file .env backend yang Devin buat)
5. Create Web Service
6. **Catat**: Backend URL: `https://ecourse-backend.onrender.com`

### 🚀 Deploy Frontend ke Vercel:

1. Login ke Vercel → Add New → Project
2. Import GitHub repository
3. Configure:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Add Environment Variables (dari file .env frontend yang Devin buat)
5. Deploy
6. **Catat**: Frontend URL: `https://your-project.vercel.app`

### 🔄 Update Cross-References:

1. Update `FRONTEND_URL` di Render environment variables dengan Vercel URL
2. Update `NEXT_PUBLIC_API_URL` di Vercel environment variables dengan Render URL
3. Re-deploy kedua services

---

## Phase 5: Verification

### ✅ Test Deployment:

- [ ] Test backend health: `curl https://ecourse-backend.onrender.com/api/health`
- [ ] Buka frontend URL di browser
- [ ] Login dengan akun demo: admin@ecourse.ac.id / Password123!
- [ ] Test upload file
- [ ] Test course creation
- [ ] Test user registration

---

## 📞 Jika Ada Masalah:

Jika mengalami kendala di setiap step:
1. Catat error message
2. Screenshoot jika perlu
3. Beritahu Devin untuk troubleshooting

---

## 🎯 Target Timeline:

- **Phase 1-2**: 30-45 menit (register & collect credentials)
- **Phase 3**: 15-20 menit (Devin setup & push to GitHub)
- **Phase 4**: 10-15 menit (deploy ke Render & Vercel)
- **Phase 5**: 5-10 menit (testing)

**Total Estimated Time**: 1-1.5 jam

---

## 📝 Notes:

- Simpan semua credentials di tempat aman (password manager)
- Jangan share credentials di public repository
- Free tier sudah cukup untuk development dan demo
- Upgrade ke paid tier jika traffic meningkat

---

**Setelah selesai Phase 1-2, kirimkan semua credentials kepada Devin untuk melanjutkan ke Phase 3!** 🚀
