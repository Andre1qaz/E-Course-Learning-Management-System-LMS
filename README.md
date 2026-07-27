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

Private — All rights reserved.
untuk Calendar & Event Management yang berfungsi sebagai pusat informasi seluruh jadwal akademik, kegiatan perkuliahan, dan pengingat aktivitas pada aplikasi E-Course. Fitur ini dapat dikelola oleh Administrator dan Lecturer, sedangkan Student hanya memiliki hak untuk melihat seluruh event yang telah dipublikasikan. Kalender harus menjadi media utama untuk menampilkan seluruh aktivitas penting selama semester sehingga mahasiswa dapat mengetahui jadwal perkuliahan, tugas, kuis, ujian, maupun kegiatan akademik lainnya dalam satu tampilan yang terintegrasi.

Administrator dan Lecturer memiliki hak untuk membuat, mengubah, menghapus, serta mempublikasikan event pada kalender. Saat membuat event, pengguna dapat mengisi informasi seperti judul kegiatan, deskripsi, kategori event, course yang terkait, tanggal mulai, tanggal berakhir, waktu pelaksanaan, lokasi atau media pelaksanaan (offline maupun online), warna penanda event, serta menentukan apakah event berlaku untuk seluruh mahasiswa atau hanya mahasiswa yang mengikuti course tertentu. Setiap event juga dapat dilengkapi dengan lampiran, tautan meeting, maupun dokumen pendukung apabila diperlukan.

Sistem harus menyediakan beberapa kategori event agar mudah dibedakan, seperti Perkuliahan, Materi Baru, Assignment, Quiz, Mid Semester Examination (UTS), Final Semester Examination (UAS), Seminar, Project, Meeting, Deadline, dan Pengumuman Akademik. Setiap kategori memiliki ikon dan warna yang berbeda sehingga pengguna dapat langsung mengenali jenis kegiatan pada kalender.

Kalender harus terintegrasi secara otomatis dengan seluruh modul pada sistem. Apabila Administrator atau Lecturer menambahkan materi, tugas, kuis, ujian, atau aktivitas pembelajaran lain pada suatu course yang memiliki tanggal pelaksanaan maupun batas waktu, sistem akan secara otomatis membuat event pada kalender tanpa perlu dibuat ulang secara manual. Sebagai contoh, ketika dosen membuat Assignment dengan batas pengumpulan pada tanggal tertentu, kalender mahasiswa akan langsung menampilkan event "Assignment Due" pada tanggal tersebut. Demikian pula ketika dosen membuat Quiz, UTS, UAS, atau menjadwalkan sesi perkuliahan, event tersebut akan otomatis muncul pada kalender seluruh mahasiswa yang terdaftar pada course tersebut.

Selain integrasi kalender, sistem juga harus memiliki fitur notifikasi otomatis (Automatic Notification System). Setiap kali Administrator atau Lecturer menambahkan course baru, mempublikasikan materi, membuat tugas, menjadwalkan kuis, membuat ujian, mengubah jadwal, atau menambahkan event baru pada kalender, sistem secara otomatis mengirimkan notifikasi kepada seluruh mahasiswa yang mengikuti course tersebut. Notifikasi ditampilkan pada Notification Center di dalam aplikasi dan dapat berupa pemberitahuan real-time tanpa perlu mahasiswa melakukan penyegaran halaman. Isi notifikasi harus mencakup informasi penting seperti nama course, judul aktivitas, tanggal pelaksanaan, serta tindakan yang perlu dilakukan oleh mahasiswa.

Kalender juga harus memiliki fitur Upcoming Events, yaitu panel yang menampilkan daftar kegiatan yang akan segera berlangsung dalam beberapa hari ke depan. Panel ini menampilkan informasi seperti nama kegiatan, course terkait, tanggal, waktu, kategori aktivitas, serta sisa waktu menuju pelaksanaan atau batas pengumpulan. Upcoming Events ditampilkan pada Dashboard dan halaman Calendar sehingga mahasiswa dapat dengan mudah mengetahui aktivitas yang harus segera dipersiapkan tanpa harus membuka kalender secara keseluruhan.

Mahasiswa hanya dapat melihat event yang telah dipublikasikan oleh Administrator atau Lecturer. Mereka dapat melihat detail setiap event, mengetahui jadwal perkuliahan, deadline tugas, jadwal kuis, jadwal ujian, maupun kegiatan akademik lainnya. Apabila terdapat perubahan jadwal atau pembaruan informasi, sistem harus memperbarui kalender secara otomatis dan mengirimkan notifikasi perubahan kepada mahasiswa agar informasi yang diterima selalu terbaru.

Fitur kalender juga harus mendukung tampilan Monthly View, Weekly View, dan Daily View, serta menyediakan fasilitas pencarian dan penyaringan berdasarkan course, kategori event, maupun rentang waktu. Pengguna dapat memilih untuk hanya menampilkan event dari course tertentu atau seluruh kegiatan akademik yang dimiliki. Setiap event yang dipilih akan menampilkan halaman detail berisi informasi lengkap, deskripsi kegiatan, lampiran, tautan pendukung, serta tombol navigasi menuju halaman aktivitas terkait, seperti halaman materi, tugas, kuis, atau ujian.

Seluruh fitur harus menerapkan Role-Based Access Control (RBAC), di mana Administrator memiliki hak penuh untuk mengelola seluruh kalender dan event pada semua course, Lecturer hanya dapat mengelola kalender dan event pada course yang menjadi tanggung jawabnya, sedangkan Student hanya memiliki hak untuk melihat event, menerima notifikasi, dan mengakses aktivitas yang telah dipublikasikan. Dengan integrasi ini, kalender tidak hanya berfungsi sebagai penampil jadwal, tetapi juga sebagai pusat informasi akademik yang selalu diperbarui secara otomatis, sehingga seluruh aktivitas pembelajaran, deadline, dan pengumuman dapat dikelola secara terpusat serta memastikan mahasiswa tidak melewatkan informasi penting selama proses pembelajaran.
