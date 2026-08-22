# E-Course — Learning Management System

Platform pembelajaran online full-stack yang dibangun dengan fokus pada **23 indikator heuristic evaluation** untuk e-Learning. Aplikasi ini dirancang khusus untuk kebutuhan akademik dengan UX yang modern dan konsisten.

## Quick Start

### Prerequisites
- **Node.js** 20+ 
- **npm** 10+
- **Docker Desktop** (untuk PostgreSQL, Redis, MinIO)

### Setup dalam 5 Menit

```bash
# 1. Clone dan setup environment
git clone <repo-url>
cd "E-Course-Learning-Management-System-LMS-"
cp .env.example .env
cp .env.example backend/.env
cp .env.example frontend/.env.local

# 2. Jalankan infrastructure (Docker)
docker compose up -d

# 3. Setup Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run start:dev

# 4. Setup Frontend (terminal baru)
cd frontend
npm install
npm run dev
```

### Akses Aplikasi
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)

## Akun Demo (Password: `Password123!`)

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

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Cache & Queue | Redis, BullMQ |
| Storage | MinIO (S3-compatible) |
| Auth | NextAuth.js (Auth.js) + JWT backend |

## Fitur Utama

### Course Management
- CRUD courses dengan enrollment code
- Kategorisasi berdasarkan tahun akademik
- Enrollment via kode atau direct enrollment
- Participant management dengan role assignment

### Learning Content
- Struktur mingguan (week-based)
- Multi-tipe aktivitas (Material, Assignment, Quiz, Forum, Video, External Link)
- Upload dan manage materi pembelajaran
- Learning objectives display

### Assessment System
- Assignment dengan deadline dan file submission
- Rubric-based grading system
- Exam dengan berbagai tipe soal (MCQ, Essay, True/False, Short Answer)
- Timer dan auto-submit
- Question bank system
- Anti-cheat logging

### Communication
- Forum diskusi dengan threaded replies
- User mentions (@username)
- Announcement system dengan validity period
- Notification system berbasis queue

### Grading & Analytics
- Comprehensive gradebook
- Grade calculation dengan customizable weights
- Grade history audit trail
- Export ke Excel/CSV/PDF
- Progress tracking per mahasiswa

### Calendar & Storage
- Calendar event management
- Private file storage dengan quota
- MinIO integration untuk file upload

## Struktur Project

```
E-Course-Learning-Management-System-LMS-/
├── docker-compose.yml      # PostgreSQL, Redis, MinIO
├── backend/                # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Demo data seeder
│   └── src/
│       ├── auth/           # Authentication & RBAC
│       ├── courses/        # Course endpoints
│       └── common/         # Interceptors, filters
└── frontend/               # Next.js App
    └── src/
        ├── app/            # Pages (App Router)
        ├── components/     # UI components
        ├── auth.ts         # NextAuth config
        └── middleware.ts   # Route protection
```

## Dokumentasi Lengkap

Untuk dokumentasi mendalam tentang arsitektur, implementasi, dan panduan pengembangan, silakan lihat file **DOKUMENTASI_PROYEK.md**.

## Status Proyek

### Sudah Implementasi
- Authentication & Authorization dengan RBAC
- Course Management lengkap
- Learning Modules & Activities
- Assignment & Rubric System
- Exam System dengan timer
- Forum Diskusi
- Announcement & Notifications
- Calendar Events
- Gradebook dengan export
- Private File Storage
- AutoValidator untuk validasi data
- CLI Resource Generator
- Email service untuk forgot password
- Excel import untuk question banks
- File upload configuration dengan MinIO
- CSRF protection
- Testing infrastructure (unit, integration, E2E)
- Error monitoring (Sentry)

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#1a365d` | Navbar, buttons, identity |
| Accent | `#e07a5f` | Highlights, progress bar |
| Success | `#2d6a4f` | Completed status |
| Warning | `#f4a261` | Approaching deadline |
| Error | `#c1121f` | Errors, late submissions |

Fonts: **Space Grotesk** (headings) + **Inter** (body)

## Heuristic Evaluation

Proyek ini mematuhi **23 dari 23 indikator evaluasi** (100%):
- Visibility of System Status
- Match Between System and Real World
- User Control and Freedom
- Consistency and Standards
- Error Prevention
- Recognition Rather Than Recall
- Flexibility and Efficiency of Use
- Aesthetic and Minimalist Design
- Help Users Recognize, Diagnose, and Recover from Errors
- Help and Documentation
- Dan 13 indikator e-Learning evaluation lainnya

## License

Private — All rights reserved.

---

**Catatan**: Untuk informasi lebih detail tentang setup, troubleshooting, dan panduan pengembangan, silakan referensi file **DOKUMENTASI_PROYEK.md**.