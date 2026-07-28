# E-Course — Learning Management System

Platform pembelajaran online full-stack yang dibangun dengan fokus pada **23 indikator heuristic evaluation** untuk e-Learning. Aplikasi ini dirancang khusus untuk kebutuhan akademik dengan UX yang modern dan konsisten.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Cache & Queue | Redis, BullMQ |
| Storage | MinIO (S3-compatible) |
| Auth | NextAuth.js (Auth.js) + JWT backend |

## Prerequisites

- **Node.js** 20+ 
- **npm** 10+
- **Docker Desktop** (untuk PostgreSQL, Redis, MinIO)

## Quick Start

### 1. Clone & Setup Environment

```bash
git clone <repo-url>
cd e-course 2

# Copy environment files
cp .env.example .env
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

Edit file `.env` sesuai kebutuhan. Default sudah dikonfigurasi untuk development lokal.

### 2. Jalankan Infrastructure (Docker)

```bash
docker compose up -d
```

Services yang berjalan:
- **PostgreSQL** → `localhost:5432`
- **Redis** → `localhost:6379`
- **MinIO** → `localhost:9000` (API), `localhost:9001` (Console)
  - Username: `minioadmin` / Password: `minioadmin123`

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migration
npm run prisma:migrate

# Seed demo data
npm run db:seed

# Start development server
npm run start:dev
```

Backend API: http://localhost:3001  
Swagger Docs: http://localhost:3001/api/docs

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend: http://localhost:3000

## Akun Demo (setelah seed)

Password semua akun: **`Password123!`**

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

## Struktur Project

```
aplikasi_andre/
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

## API Response Format

Semua endpoint menggunakan format konsisten:

```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#1a365d` | Navbar, buttons, identity |
| Accent | `#e07a5f` | Highlights, progress bar |
| Success | `#2d6a4f` | Completed status |
| Warning | `#f4a261` | Approaching deadline |
| Error | `#c1121f` | Errors, late submissions |

Fonts: **Space Grotesk** (headings) + **Inter** (body)

## Fase Development

###  Fase 1 — Fondasi (Current)
- [x] Docker Compose (PostgreSQL, Redis, MinIO)
- [x] Prisma schema lengkap (semua entities)
- [x] NestJS backend dengan auth, RBAC, Swagger
- [x] Next.js frontend dengan design tokens
- [x] NextAuth.js integration
- [x] Login, Register, Forgot Password
- [x] Dashboard per role dengan course cards
- [x] Seed data demo
- [x] Error pages (403, 404, 500)

### Fase 2 — Course Management
- CRUD course (dosen/admin)
- Enrollment via kode course
- Modul pembelajaran dengan upload file
- Learning objectives display

### Fase 3 — Tugas & Penilaian
- Assignment creation & submission
- File upload via MinIO presigned URL
- Grading dengan feedback & rubrik

### Fase 4 — Ujian
- Exam builder (MC, Essay, Short Answer)
- Timer countdown & auto-submit
- Anti-cheat logging
- Manual & auto grading

### Fase 5 — Fitur Pendukung
- Kalender & catatan personal
- Private file storage dengan kuota
- Forum diskusi per course
- Notifikasi (BullMQ)
- Gradebook & export CSV

## Heuristic Indicators Traceability

Setiap implementasi UI/UX mencantumkan comment `Heuristic #N` di kode untuk traceability. Contoh:

- `#1 Visibility` → Toast notifications (sonner), skeleton loading, progress bars
- `#5 Error Prevention` → Frontend + backend validation (class-validator)
- `#6 Recognition` → Breadcrumbs, sidebar navigation, explicit labels
- `#13 Storage Capability` → Visual quota progress bar (fase 5)
- `#21 Motivation` → Course progress bar dengan gradient accent

## License

# Install backend dependencies
cd backend
npm install exceljs pdfkit

# Run database migration
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

Private — All rights reserved.


Discussion Forum

Buat fitur Discussion Forum pada setiap course sebagai media komunikasi antara Lecturer dan Student. Setiap course memiliki forum diskusi yang dapat digunakan untuk membahas materi, tugas, maupun topik pembelajaran lainnya. Mahasiswa dapat membuat topik diskusi baru, mengajukan pertanyaan, membalas komentar pengguna lain, mengunggah gambar atau dokumen pendukung, serta melakukan mention kepada dosen menggunakan simbol @ agar dosen menerima notifikasi. Lecturer dan Administrator dapat membalas diskusi, memberikan jawaban, menghapus komentar yang tidak sesuai, mengunci atau menutup diskusi apabila topik telah selesai dibahas, serta menandai jawaban terbaik sebagai solusi. Seluruh aktivitas forum harus mendukung notifikasi otomatis sehingga setiap balasan, mention, maupun diskusi baru dapat diketahui oleh pengguna yang terkait.


Announcement

Buat fitur Announcement yang memungkinkan Administrator dan Lecturer membuat pengumuman resmi untuk setiap course maupun pengumuman yang berlaku secara umum. Pengumuman dapat berisi judul, isi pengumuman, lampiran apabila diperlukan, tanggal publikasi, serta periode berlakunya pengumuman. Setelah dipublikasikan, pengumuman akan otomatis muncul pada Dashboard, Notification Center, serta halaman course yang bersangkutan sehingga mahasiswa dapat langsung mengetahui informasi terbaru tanpa harus mencarinya secara manual. Sistem juga harus memberikan penanda apabila terdapat pengumuman baru yang belum dibaca oleh mahasiswa. Administrator memiliki hak untuk membuat pengumuman global yang ditujukan kepada seluruh pengguna, sedangkan Lecturer hanya dapat membuat pengumuman pada course yang menjadi tanggung jawabnya.

Dashboard Statistics

Buat halaman Dashboard yang menampilkan ringkasan informasi dan statistik sesuai dengan role pengguna. Dashboard Administrator menampilkan total course, total mahasiswa, total dosen, total assignment, total quiz, total course aktif, jumlah pengguna aktif, serta aktivitas terbaru yang terjadi pada sistem. Dashboard Lecturer menampilkan jumlah course yang diajar, jumlah mahasiswa pada seluruh course, assignment yang masih aktif, assignment yang belum dinilai, quiz yang sedang berlangsung, serta aktivitas terbaru pada course yang diajarkan. Dashboard Student menampilkan jumlah course yang diikuti, assignment yang belum diselesaikan, upcoming event, pengumuman terbaru, rata-rata nilai, progress pembelajaran, serta notifikasi aktivitas terbaru. Dashboard harus diperbarui secara otomatis berdasarkan data yang tersimpan sehingga setiap pengguna memperoleh informasi terkini mengenai aktivitas pembelajaran.

Course Progress

Buat fitur Course Progress yang menampilkan perkembangan pembelajaran mahasiswa pada setiap course. Progress dihitung secara otomatis berdasarkan aktivitas yang telah diselesaikan, seperti materi yang telah dipelajari, assignment yang telah dikumpulkan, quiz yang telah dikerjakan, ujian yang telah diselesaikan, serta aktivitas pembelajaran lainnya. Progress ditampilkan dalam bentuk progress bar dan persentase sehingga mahasiswa dapat mengetahui sejauh mana pembelajaran telah diselesaikan. Lecturer dan Administrator juga dapat melihat progress seluruh mahasiswa pada setiap course untuk memantau perkembangan belajar masing-masing peserta. Progress akan diperbarui secara otomatis setiap kali mahasiswa menyelesaikan suatu aktivitas dan menjadi salah satu indikator utama pada Dashboard serta halaman Course Detail. Fitur ini bertujuan membantu mahasiswa memonitor pencapaian belajarnya sekaligus membantu dosen mengidentifikasi mahasiswa yang masih tertinggal dalam proses pembelajaran.