# Panduan Setup Project E-Course LMS

Panduan lengkap untuk menjalankan project E-Course LMS di VSCode dengan terminal terintegrasi.

## 📋 Prerequisites

Pastikan software berikut sudah terinstall di komputer Anda:

1. **Node.js** versi 20+ 
   - Download: https://nodejs.org/
   - Cek versi: `node --version`

2. **npm** versi 10+ (biasanya terinstall bersama Node.js)
   - Cek versi: `npm --version`

3. **Docker Desktop** (untuk PostgreSQL, Redis, MinIO)
   - Download: https://www.docker.com/products/docker-desktop/
   - Pastikan Docker Desktop sudah running sebelum memulai

4. **Git** (untuk clone repository)
   - Download: https://git-scm.com/downloads
   - Cek versi: `git --version`

5. **VSCode** (Recommended)
   - Download: https://code.visualstudio.com/
   - Extensions yang disarankan:
     - ESLint
     - Prettier
     - TypeScript and JavaScript Language Features

---

## 🚀 Langkah-langkah Setup

### 1. Clone Repository

Buka terminal di VSCode (Ctrl + `) dan jalankan:

```bash
# Clone repository
git clone <repository-url>
cd e-course_2
```

### 2. Setup Environment Variables

Copy file environment example ke semua lokasi yang dibutuhkan:

```bash
# Copy ke root directory
cp .env.example .env

# Copy ke backend
cp .env.example backend/.env

# Copy ke frontend
cp .env.example frontend/.env.local
```

**Catatan:** File `.env.example` sudah berisi konfigurasi default untuk development lokal. Tidak perlu diubah kecuali ada kebutuhan khusus.

### 3. Jalankan Infrastructure dengan Docker

Pastikan Docker Desktop sudah running, lalu jalankan:

```bash
# Jalankan semua services (PostgreSQL, Redis, MinIO)
docker compose up -d
```

Services yang akan berjalan:
- **PostgreSQL** → `localhost:5433` (database)
- **Redis** → `localhost:6379` (cache & queue)
- **MinIO** → `localhost:9000` (API), `localhost:9001` (Console)

Cek status services:
```bash
# Lihat status semua containers
docker compose ps

# Lihat logs (jika ada error)
docker compose logs -f
```

Untuk menghentikan services:
```bash
docker compose down
```

### 4. Setup Backend

Buka terminal baru di VSCode (Terminal > New Terminal) dan jalankan perintah berikut:

```bash
# Masuk ke directory backend
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migration
npm run prisma:migrate

# Seed demo data (opsional, tapi disarankan)
npm run db:seed

# Start development server
npm run start:dev
```

**Backend akan berjalan di:** http://localhost:3000  
**Swagger Documentation:** http://localhost:3000/api/docs

### 5. Setup Frontend

Buka terminal baru lagi di VSCode (Terminal > New Terminal) dan jalankan:

```bash
# Masuk ke directory frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend akan berjalan di:** http://localhost:3000

---

## 💡 Tips untuk VSCode

### Multiple Terminal Setup

Untuk menjalankan backend dan frontend secara bersamaan:

1. **Terminal 1** - Docker & Backend:
   ```bash
   docker compose up -d
   cd backend
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   npm run db:seed
   npm run start:dev
   ```

2. **Terminal 2** - Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### VSCode Tasks (Opsional)

Anda bisa membuat `.vscode/tasks.json` untuk shortcut commands:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Docker",
      "type": "shell",
      "command": "docker compose up -d",
      "problemMatcher": []
    },
    {
      "label": "Backend Dev",
      "type": "shell",
      "command": "cd backend && npm run start:dev",
      "problemMatcher": []
    },
    {
      "label": "Frontend Dev",
      "type": "shell",
      "command": "cd frontend && npm run dev",
      "problemMatcher": []
    }
  ]
}
```

---

## 🔐 Akun Demo (Setelah Seed)

Password untuk semua akun: **`Password123!`**

| Role | Email |
|------|-------|
| Admin | admin@ecourse.ac.id |
| Dosen | dosen1@ecourse.ac.id, dosen2@ecourse.ac.id |
| Mahasiswa | mahasiswa1@ecourse.ac.id — mahasiswa5@ecourse.ac.id |

### Kode Enrollment Course

| Course | Kode |
|--------|------|
| Pemrograman Web | WEB2025 |
| Basis Data | BD2025 |
| Algoritma & Struktur Data | ALG2024 |

---

## 🛠️ Commands Penting

### Backend Commands

```bash
cd backend

# Development
npm run start:dev        # Start dengan watch mode
npm run start:debug      # Start dengan debug mode

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migration
npm run db:seed          # Seed demo data

# Production
npm run build            # Build untuk production
npm run start:prod       # Start production server

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run e2e tests
npm run test:cov         # Run dengan coverage

# Linting
npm run lint             # Run ESLint
npm run format           # Run Prettier
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev              # Start development server
npm run build            # Build untuk production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Docker Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# View status
docker compose ps

# Restart specific service
docker compose restart postgres
docker compose restart redis
docker compose restart minio

# Remove all data (⚠️ Hati-hati!)
docker compose down -v
```

---

## 🔧 Troubleshooting

### Port Already in Use

Jika ada error "port already in use":

```bash
# Cek process yang menggunakan port
# Windows (PowerShell)
netstat -ano | findstr :5433
netstat -ano | findstr :3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Docker Desktop Not Running

Pastikan Docker Desktop sudah start:
- Buka Docker Desktop application
- Tunggu sampai status "Docker Desktop is running"

### Database Connection Error

Jika backend tidak bisa connect ke database:

1. Cek apakah PostgreSQL container running:
   ```bash
   docker compose ps postgres
   ```

2. Cek logs:
   ```bash
   docker compose logs postgres
   ```

3. Restart container:
   ```bash
   docker compose restart postgres
   ```

### Prisma Migration Error

Jika ada error saat migration:

```bash
cd backend

# Reset database (⚠️ Akan menghapus semua data!)
npx prisma migrate reset

# Atau create migration baru
npx prisma migrate dev --name init
```

### Module Not Found Error

Jika ada error "module not found":

```bash
# Delete node_modules dan reinstall
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Permission Error (Windows)

Jika ada permission error di Windows:

```bash
# Jalankan VSCode sebagai Administrator
# Atau adjust execution policy di PowerShell:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📁 Struktur Project

```
e-course_2/
├── docker-compose.yml          # Docker services configuration
├── .env.example               # Environment variables template
├── SETUP.md                   # File ini - panduan setup
├── README.md                  # Dokumentasi lengkap project
├── backend/                   # NestJS Backend
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Demo data seeder
│   ├── src/                   # Source code
│   └── package.json           # Backend dependencies
└── frontend/                  # Next.js Frontend
    ├── src/                   # Source code
    └── package.json           # Frontend dependencies
```

---

## 🌐 Access URLs

Setelah setup selesai:

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:3000 |
| **Swagger Docs** | http://localhost:3000/api/docs |
| **MinIO Console** | http://localhost:9001 |
| **MinIO API** | http://localhost:9000 |

**MinIO Console Credentials:**
- Username: `minioadmin`
- Password: `minioadmin123`

---

## 🔄 Workflow Development Harian

Untuk development sehari-hari:

1. **Start Docker** (jika belum running):
   ```bash
   docker compose up -d
   ```

2. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm run start:dev
   ```

3. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

4. **Buka browser**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3000/api/docs

5. **Setelah selesai**:
   ```bash
   # Stop Docker services
   docker compose down
   ```

---

## 📚 Dokumentasi Tambahan

Untuk dokumentasi lengkap tentang fitur, arsitektur, dan API endpoints, lihat:
- **README.md** - Dokumentasi lengkap project
- **Backend** - http://localhost:3000/api/docs (Swagger)

---

## ❓ Need Help?

Jika mengalami masalah:

1. Cek section **Troubleshooting** di atas
2. Lihat logs Docker: `docker compose logs -f`
3. Cek dokumentasi di README.md
4. Pastikan semua prerequisites terinstall dengan benar

---

**Selamat mengembangkan! 🚀**
