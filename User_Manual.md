# Panduan Pengguna E-Course Learning Management System (LMS)

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Persyaratan Sistem](#persyaratan-sistem)
3. [Instalasi dan Setup](#instalasi-dan-setup)
4. [Panduan Login dan Registrasi](#panduan-login-dan-registrasi)
5. [Panduan Penggunaan Berdasarkan Role](#panduan-penggunaan-berdasarkan-role)
   - [Panduan Admin](#panduan-admin)
   - [Panduan Dosen](#panduan-dosen)
   - [Panduan Mahasiswa](#panduan-mahasiswa)
6. [Panduan Fitur Utama](#panduan-fitur-utama)
   - [Manajemen Course](#manajemen-course)
   - [Manajemen Materi Pembelajaran](#manajemen-materi-pembelajaran)
   - [Sistem Assignment](#sistem-assignment)
   - [Sistem Ujian (Exam)](#sistem-ujian-exam)
   - [Forum Diskusi](#forum-diskusi)
   - [Sistem Pengumuman](#sistem-pengumuman)
   - [Kalender Kegiatan](#kalender-kegiatan)
   - [Gradebook](#gradebook)
   - [File Storage Pribadi](#file-storage-pribadi)
7. [Troubleshooting](#troubleshooting)
8. [FAQ (Pertanyaan yang Sering Diajukan)](#faq-pertanyaan-yang-sering-diajukan)
9. [Kontak dan Dukungan](#kontak-dan-dukungan)

---

## Pendahuluan

### Tentang E-Course LMS

E-Course Learning Management System (LMS) adalah platform pembelajaran online full-stack yang dirancang khusus untuk kebutuhan akademik dengan fokus pada 23 indikator heuristic evaluation untuk e-Learning. Platform ini menyediakan solusi komprehensif untuk manajemen pembelajaran online termasuk course management, assignment, exams, forum diskusi, dan sistem penilaian.

### Fitur Utama

- **Manajemen Course Lengkap** - CRUD courses dengan enrollment code dan kategorisasi
- **Sistem Pembelajaran Berbasis Mingguan** - Struktur mingguan dengan berbagai tipe aktivitas
- **Sistem Assessment Komprehensif** - Assignment dengan rubric grading dan exam dengan berbagai tipe soal
- **Forum Diskusi Interaktif** - Threaded replies, user mentions, dan file attachments
- **Gradebook Canggih** - Perhitungan nilai dengan bobot kustom dan audit trail
- **Kalender Kegiatan** - Manajemen jadwal dan pengingat otomatis
- **Sistem Notifikasi** - Notifikasi real-time untuk berbagai kegiatan
- **File Storage Pribadi** - Storage pribadi dengan quota management
- **Keamanan Terjamin** - Role-based access control dan berbagai fitur keamanan

### Arsitektur Sistem

Platform ini menggunakan arsitektur modern dengan teknologi terkini:

- **Frontend**: Next.js 16 dengan App Router, TypeScript, Tailwind CSS, dan shadcn/ui
- **Backend**: NestJS dengan TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Cache & Queue**: Redis dan BullMQ
- **Storage**: MinIO (S3-compatible)
- **Authentication**: NextAuth.js dan JWT

---

## Persyaratan Sistem

### Persyaratan Hardware

- **CPU**: Minimal 2 core (recommended 4 core atau lebih)
- **RAM**: Minimal 4 GB (recommended 8 GB atau lebih)
- **Storage**: Minimal 20 GB free space

### Persyaratan Software

- **Operating System**: Windows 10/11, macOS, atau Linux
- **Node.js**: Versi 20 atau lebih tinggi
- **npm**: Versi 10 atau lebih tinggi
- **Docker Desktop**: Untuk menjalankan PostgreSQL, Redis, dan MinIO
- **Browser**: Chrome, Firefox, Safari, atau Edge (versi terbaru)

### Persyaratan Jaringan

- Koneksi internet stabil untuk akses aplikasi
- Akses ke port 3000 (frontend), 3001 (backend), 5433 (PostgreSQL), 6379 (Redis), 9000/9001 (MinIO)

---

## Instalasi dan Setup

### Langkah 1: Clone Repository

```bash
git clone <repository-url>
cd "E-Course-Learning-Management-System-LMS-"
```

### Langkah 2: Setup Environment Variables

Salin file environment example dan sesuaikan:

```bash
cp .env.example .env
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

### Langkah 3: Jalankan Infrastructure dengan Docker

```bash
docker compose up -d
```

Services yang akan berjalan:
- **PostgreSQL** → `localhost:5433` (database)
- **Redis** → `localhost:6379` (cache & queue)
- **MinIO** → `localhost:9000` (API), `localhost:9001` (Console)

### Langkah 4: Setup Backend

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

Backend API akan berjalan di: http://localhost:3001
Swagger Documentation: http://localhost:3001/api/docs

### Langkah 5: Setup Frontend

Buka terminal baru dan jalankan:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend akan berjalan di: http://localhost:3000

### Verifikasi Instalasi

Pastikan semua komponen berjalan dengan baik:

1. Docker services running (PostgreSQL, Redis, MinIO)
2. Backend server berjalan tanpa error
3. Frontend server berjalan tanpa error
4. Bisa akses aplikasi di http://localhost:3000
5. API documentation accessible di http://localhost:3001/api/docs

---

## Panduan Login dan Registrasi

### Akun Demo (Password: `Password123!`)

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

### Cara Login

1. Buka browser dan akses http://localhost:3000
2. Klik tombol "Login" di halaman utama
3. Masukkan email dan password
4. Klik tombol "Masuk"
5. Anda akan diarahkan ke dashboard sesuai role Anda

### Cara Registrasi

1. Buka browser dan akses http://localhost:3000
2. Klik tombol "Daftar" di halaman utama
3. Isi formulir pendaftaran:
   - Nama lengkap
   - Email
   - Password
   - Konfirmasi password
4. Klik tombol "Daftar"
5. Akun Anda akan dibuat dengan role default: MAHASISWA
6. Anda bisa langsung login setelah registrasi

### Lupa Password

1. Di halaman login, klik "Lupa Password?"
2. Masukkan email yang terdaftar
3. Cek email untuk instruksi reset password
4. Ikuti link yang diberikan untuk reset password

---

## Panduan Penggunaan Berdasarkan Role

## Panduan Admin

### Dashboard Admin

Dashboard admin menampilkan:
- Statistik pengguna (total users, admin, dosen, mahasiswa)
- Statistik course (total courses, active courses)
- Statistik aktivitas (total assignments, exams, forum threads)
- Aktivitas terbaru di sistem

### Manajemen User

#### Melihat Daftar User
1. Buka menu "Users" di sidebar
2. Anda akan melihat daftar semua user yang terdaftar
3. Data yang ditampilkan: nama, email, role, status aktif

#### Menambah User Baru
1. Buka menu "Users" di sidebar
2. Klik tombol "Tambah User"
3. Isi formulir:
   - Nama lengkap
   - Email
   - Password
   - Role (ADMIN, DOSEN, MAHASISWA)
4. Klik "Simpan"

#### Mengedit User
1. Buka menu "Users" di sidebar
2. Klik tombol "Edit" pada user yang ingin diubah
3. Update informasi yang diperlukan
4. Klik "Simpan"

#### Menghapus User
1. Buka menu "Users" di sidebar
2. Klik tombol "Hapus" pada user yang ingin dihapus
3. Konfirmasi penghapusan

#### Melihat Activity Log User
1. Buka menu "Users" di sidebar
2. Klik tombol "Activity Log" pada user yang ingin dilihat
3. Anda akan melihat riwayat aktivitas user tersebut

### Manajemen Course

#### Membuat Course Baru
1. Buka menu "Courses" di sidebar
2. Klik tombol "Buat Course"
3. Isi formulir course:
   - Nama course
   - Kode course
   - Deskripsi
   - Learning objectives
   - Enrollment code (opsional)
   - Pilih dosen pengajar
   - Pilih kategori
   - Thumbnail color
4. Klik "Simpan"

#### Mengedit Course
1. Buka menu "Courses" di sidebar
2. Klik pada course yang ingin diedit
3. Klik tombol "Edit"
4. Update informasi yang diperlukan
5. Klik "Simpan"

#### Menghapus Course
1. Buka menu "Courses" di sidebar
2. Klik pada course yang ingin dihapus
3. Klik tombol "Hapus"
4. Konfirmasi penghapusan

#### Kelola Enrollment
1. Buka course yang ingin dikelola
2. Klik tab "Participants"
3. Anda bisa:
   - Melihat daftar peserta
   - Menambah peserta secara langsung
   - Menghapus peserta
   - Mengubah role peserta

### Manajemen Kategori Course

1. Buka menu "Categories" di sidebar
2. Klik "Tambah Kategori"
3. Isi nama kategori dan tahun akademik
4. Klik "Simpan"

---

## Panduan Dosen

### Dashboard Dosen

Dashboard dosen menampilkan:
- Course yang diajar
- Statistik mahasiswa per course
- Assignment yang perlu dinilai
- Exam yang perlu dinilai
- Pengumuman terbaru

### Manajemen Course

#### Membuat Course Baru
1. Buka menu "Courses" di sidebar
2. Klik tombol "Buat Course"
3. Isi formulir course:
   - Nama course
   - Kode course
   - Deskripsi
   - Learning objectives
   - Enrollment code
   - Pilih kategori
   - Thumbnail color
4. Klik "Simpan"

#### Mengelola Enrollment
1. Buka course yang ingin dikelola
2. Klik tab "Settings"
3. Atur enrollment:
   - Enable/disable enrollment
   - Generate enrollment code baru
   - Atur enrollment key

#### Menambah Peserta Langsung
1. Buka course yang ingin dikelola
2. Klik tab "Participants"
3. Klik "Tambah Peserta"
4. Pilih mahasiswa dari daftar
5. Tentukan role (STUDENT atau ASSISTANT)
6. Klik "Simpan"

### Manajemen Materi Pembelajaran

#### Membuat Minggu Pembelajaran (Week)
1. Buka course yang ingin dikelola
2. Klik tab "Content"
3. Klik "Tambah Minggu"
4. Isi:
   - Nomor minggu
   - Judul minggu
   - Tanggal mulai dan selesai
5. Klik "Simpan"

#### Menambah Aktivitas
1. Buka minggu yang ingin ditambah aktivitas
2. Klik "Tambah Aktivitas"
3. Pilih tipe aktivitas:
   - **Material**: Materi pembelajaran (PDF, video, dll)
   - **Assignment**: Tugas
   - **Quiz**: Kuis
   - **Forum**: Forum diskusi
   - **Video**: Video pembelajaran
   - **External Link**: Link eksternal
4. Isi detail aktivitas
5. Klik "Simpan"

#### Upload Materi
1. Buka aktivitas bertipe Material
2. Klik "Upload File"
3. Pilih file dari komputer
4. Tunggu proses upload selesai
5. File akan tersimpan di MinIO

### Manajemen Assignment

#### Membuat Assignment
1. Buka course yang ingin dikelola
2. Klik tab "Assignments"
3. Klik "Buat Assignment"
4. Isi detail assignment:
   - Judul
   - Deskripsi
   - Deadline
   - Nilai maksimal
5. Klik "Simpan"

#### Membuat Rubric
1. Buka assignment yang ingin diberi rubric
2. Klik tab "Rubric"
3. Klik "Buat Rubric"
4. Tambah criteria:
   - Nama criteria
   - Deskripsi
   - Nilai maksimal
5. Tambah levels untuk setiap criteria:
   - Level (misal: Excellent, Good, Fair, Poor)
   - Deskripsi
   - Nilai
6. Klik "Simpan"

#### Menilai Assignment
1. Buka assignment yang ingin dinilai
2. Klik tab "Submissions"
3. Klik submission mahasiswa
4. Berikan nilai:
   - Manual grading atau
   - Rubric-based grading
5. Tambah feedback
6. Klik "Simpan Nilai"

#### Bulk Grading
1. Buka assignment yang ingin dinilai
2. Klik tab "Submissions"
3. Klik "Bulk Grade"
4. Berikan nilai untuk beberapa submission sekaligus
5. Klik "Simpan"

### Manajemen Exam

#### Membuat Exam
1. Buka course yang ingin dikelola
2. Klik tab "Exams"
3. Klik "Buat Exam"
4. Isi detail exam:
   - Judul
   - Deskripsi
   - Waktu mulai
   - Deadline
   - Durasi (menit)
   - Nilai maksimal
   - Nilai lulus
   - Acak soal (opsional)
   - Tampilkan hasil (opsional)
   - Anti-cheat (opsional)
5. Klik "Simpan"

#### Menambah Soal
1. Buka exam yang ingin ditambah soal
2. Klik tab "Questions"
3. Klik "Tambah Soal"
4. Pilih tipe soal:
   - **Multiple Choice**: Pilihan ganda
   - **True/False**: Benar/Salah
   - **Short Answer**: Jawaban singkat
   - **Essay**: Essay
5. Isi detail soal:
   - Pertanyaan
   - Pilihan jawaban (untuk MCQ)
   - Jawaban benar
   - Penjelasan
   - Poin
6. Klik "Simpan"

#### Membuat Question Bank
1. Buka course yang ingin dikelola
2. Klik tab "Question Banks"
3. Klik "Buat Question Bank"
4. Isi:
   - Judul
   - Deskripsi
   - Topik
   - Tingkat kesulitan
   - Tipe soal
   - Tags
5. Klik "Simpan"

#### Import Soal dari Excel
1. Buka question bank yang ingin diimport
2. Klik "Import dari Excel"
3. Download template Excel
4. Isi template dengan soal-soal
5. Upload file Excel
6. Soal akan otomatis terimport

#### Menilai Exam
1. Buka exam yang ingin dinilai
2. Klik tab "Results"
3. Lihat hasil mahasiswa
4. Soal MCQ akan dinilai otomatis
5. Untuk essay, berikan nilai manual
6. Klik "Simpan Nilai"

### Manajemen Forum

#### Membuat Forum Thread
1. Buka course yang ingin dikelola
2. Klik tab "Forum"
3. Klik "Buat Thread"
4. Isi:
   - Judul
   - Konten
5. Klik "Simpan"

#### Moderasi Forum
1. Buka thread yang ingin dimoderasi
2. Anda bisa:
   - Pin thread (sematkan)
   - Lock thread (kunci)
   - Pilih best answer
   - Hapus thread/reply

### Manajemen Pengumuman

#### Membuat Pengumuman
1. Buka course yang ingin dikelola
2. Klik tab "Announcements"
3. Klik "Buat Pengumuman"
4. Isi:
   - Judul
   - Konten
   - Prioritas (Normal, High, Urgent)
   - Periode validitas
5. Klik "Simpan" dan "Publish"

#### Mengedit Pengumuman
1. Buka pengumuman yang ingin diedit
2. Klik "Edit"
3. Update konten
4. Klik "Simpan"

### Manajemen Kalender

#### Membuat Event
1. Buka menu "Calendar" di sidebar
2. Klik "Tambah Event"
3. Isi:
   - Judul
   - Deskripsi
   - Tanggal dan waktu
   - Lokasi atau meeting link
   - Kategori event
   - Target audience
4. Klik "Simpan"

### Manajemen Gradebook

#### Mengatur Bobot Nilai
1. Buka course yang ingin dikelola
2. Klik tab "Gradebook"
3. Klik "Settings"
4. Atur bobot:
   - Assignment weight
   - Quiz weight
   - UTS weight
   - UAS weight
   - Other weight
   - Passing grade
5. Klik "Simpan"

#### Melihat Gradebook
1. Buka course yang ingin dilihat
2. Klik tab "Gradebook"
3. Anda akan melihat:
   - Daftar mahasiswa
   - Nilai per komponen
   - Nilai akhir
   - Letter grade

#### Export Gradebook
1. Buka tab "Gradebook"
2. Klik "Export"
3. Pilih format:
   - Excel
   - CSV
   - PDF
4. File akan terdownload

#### Bulk Update Nilai
1. Buka tab "Gradebook"
2. Klik "Bulk Update"
3. Update nilai beberapa mahasiswa sekaligus
4. Klik "Simpan"

---

## Panduan Mahasiswa

### Dashboard Mahasiswa

Dashboard mahasiswa menampilkan:
- Course yang diikuti
- Progress per course
- Assignment yang perlu dikerjakan
- Exam yang akan datang
- Pengumuman terbaru
- Event kalender

### Enrollment Course

#### Enrollment via Kode
1. Buka menu "Courses" di sidebar
2. Klik "Enroll via Kode"
3. Masukkan enrollment code course
4. Klik "Enroll"
5. Anda akan ditambahkan ke course

#### Melihat Course yang Diikuti
1. Buka menu "My Courses" di sidebar
2. Anda akan melihat semua course yang diikuti
3. Informasi yang ditampilkan:
   - Nama course
   - Dosen pengajar
   - Progress
   - Aktivitas terbaru

### Mengakses Materi Pembelajaran

#### Melihat Materi per Minggu
1. Buka course yang ingin dipelajari
2. Klik tab "Content"
3. Pilih minggu yang ingin dipelajari
4. Anda akan melihat semua aktivitas di minggu tersebut

#### Mengakses Material
1. Buka aktivitas bertipe Material
2. Klik pada file yang ingin diakses
3. File akan terbuka di browser atau terdownload

#### Menonton Video
1. Buka aktivitas bertipe Video
2. Video player akan muncul
3. Anda bisa memutar, pause, dan mengontrol video

### Mengerjakan Assignment

#### Melihat Assignment
1. Buka course yang ingin dilihat
2. Klik tab "Assignments"
3. Anda akan melihat semua assignment dalam course
4. Informasi yang ditampilkan:
   - Judul
   - Deadline
   - Status (Not Submitted, Submitted, Graded)
   - Nilai (jika sudah dinilai)

#### Submit Assignment
1. Buka assignment yang ingin dikerjakan
2. Klik "Submit Assignment"
3. Upload file assignment
4. Tunggu proses upload selesai
5. Klik "Submit"
6. Anda akan mendapatkan konfirmasi

#### Melihat Feedback
1. Buka assignment yang sudah dinilai
2. Klik tab "Submission"
3. Anda akan melihat:
   - Nilai
   - Feedback dari dosen
   - Rubric assessment (jika ada)

### Mengerjakan Exam

#### Melihat Exam
1. Buka course yang ingin dilihat
2. Klik tab "Exams"
3. Anda akan melihat semua exam dalam course
4. Informasi yang ditampilkan:
   - Judul
   - Waktu mulai
   - Deadline
   - Durasi
   - Status

#### Memulai Exam
1. Buka exam yang ingin dikerjakan
2. Pastikan waktu sudah masuk dalam periode exam
3. Klik "Mulai Exam"
4. Timer akan mulai berjalan
5. Anda tidak bisa menutgu tab browser (anti-cheat)

#### Menjawab Soal
1. Jawab soal sesuai tipe:
   - **Multiple Choice**: Pilih jawaban yang benar
   - **True/False**: Pilih Benar atau Salah
   - **Short Answer**: Ketik jawaban singkat
   - **Essay**: Ketik jawaban essay
2. Anda bisa navigasi antar soal
3. Klik "Next" untuk soal berikutnya
4. Klik "Previous" untuk soal sebelumnya

#### Submit Exam
1. Setelah selesai menjawab semua soal
2. Klik "Submit Exam"
3. Konfirmasi submit
4. Anda akan melihat hasil (jika dosen mengaktifkan show results)

#### Melihat Hasil Exam
1. Buka exam yang sudah selesai
2. Klik tab "Results"
3. Anda akan melihat:
   - Nilai total
   - Jawaban benar/salah
   - Penjelasan per soal
   - Feedback dari dosen

### Berpartisipasi dalam Forum

#### Melihat Thread Forum
1. Buka course yang ingin dilihat
2. Klik tab "Forum"
3. Anda akan melihat semua thread dalam course

#### Membuat Thread Baru
1. Klik "Buat Thread"
2. Isi:
   - Judul
   - Konten
3. Upload attachment (opsional)
4. Klik "Simpan"

#### Reply Thread
1. Buka thread yang ingin direply
2. Ketik jawaban di kolom reply
3. Anda bisa mention user dengan @username
4. Upload attachment (opsional)
5. Klik "Reply"

#### Mention User
1. Ketik @ di kolom reply
2. Pilih user dari daftar yang muncul
3. User akan mendapatkan notifikasi

### Melihat Pengumuman

#### Melihat Pengumuman Course
1. Buka course yang ingin dilihat
2. Klik tab "Announcements"
3. Anda akan melihat semua pengumuman dalam course
4. Pengumuman yang belum dibaca akan ditandai

#### Melihat Pengumuman Global
1. Buka menu "Announcements" di sidebar
2. Anda akan melihat semua pengumuman global

### Mengakses Kalender

#### Melihat Kalender
1. Buka menu "Calendar" di sidebar
2. Anda akan melihat kalender dengan semua event
3. Event ditandai dengan warna berbeda per kategori

#### Melihat Detail Event
1. Klik pada event di kalender
2. Anda akan melihat detail event
3. Jika ada meeting link, Anda bisa klik untuk join

### Melihat Gradebook

#### Melihat Nilai
1. Buka course yang ingin dilihat
2. Klik tab "Gradebook"
3. Anda akan melihat:
   - Nilai per komponen
   - Nilai akhir
   - Letter grade
   - Progress

#### Melihat History Nilai
1. Buka tab "Gradebook"
2. Klik "History"
3. Anda akan melihat riwayat perubahan nilai

### Menggunakan File Storage Pribadi

#### Mengakses File Storage
1. Buka menu "My Files" di sidebar
2. Anda akan melihat file-file pribadi Anda

#### Upload File
1. Klik "Upload File"
2. Pilih file dari komputer
3. Tunggu proses upload selesai
4. File akan tersimpan di storage pribadi

#### Membuat Folder
1. Klik "Buat Folder"
2. Masukkan nama folder
3. Klik "Simpan"

#### Menghapus File/Folder
1. Klik pada file/folder yang ingin dihapus
2. Klik "Hapus"
3. Konfirmasi penghapusan

### Mengelola Profil

#### Mengedit Profil
1. Klik avatar di pojok kanan atas
2. Klik "Profile"
3. Edit informasi:
   - Nama
   - Email
   - Avatar
4. Klik "Simpan"

#### Mengubah Password
1. Klik avatar di pojok kanan atas
2. Klik "Profile"
3. Klik tab "Security"
4. Masukkan password lama
5. Masukkan password baru
6. Konfirmasi password baru
7. Klik "Simpan"

---

## Panduan Fitur Utama

## Manajemen Course

### Overview

Manajemen course adalah fitur utama untuk mengelola mata kuliah atau course pembelajaran. Fitur ini memungkinkan pembuatan, pengeditan, dan pengelolaan course secara lengkap.

### Fitur Utama

- **CRUD Course**: Create, Read, Update, Delete course
- **Enrollment Code**: Sistem kode enrollment untuk mahasiswa
- **Kategorisasi**: Pengelompokan course berdasarkan tahun akademik
- **Direct Enrollment**: Penambahan peserta langsung oleh admin/dosen
- **Participant Management**: Kelola peserta dengan role assignment
- **Course Settings**: Pengaturan bobot nilai dan parameter lain
- **Progress Tracking**: Lacak progress mahasiswa per course

### Tips Penggunaan

- Gunakan enrollment code yang mudah diingat
- Kategorikan course berdasarkan tahun akademik untuk organisasi yang baik
- Berikan deskripsi dan learning objectives yang jelas
- Atur enrollment code secara berkala untuk keamanan

---

## Manajemen Materi Pembelajaran

### Overview

Manajemen materi pembelajaran memungkinkan dosen untuk mengatur konten pembelajaran secara terstruktur dengan sistem berbasis mingguan.

### Struktur

- **Week**: Pembagian konten berdasarkan minggu
- **Activity**: Aktivitas dalam setiap minggu
- **Module**: Modul pembelajaran dengan file attachments

### Tipe Aktivitas

1. **Material**: Materi pembelajaran (PDF, slide, dokumentasi)
2. **Assignment**: Tugas yang harus dikumpulkan
3. **Quiz**: Kuis online
4. **Forum**: Forum diskusi
5. **Video**: Video pembelajaran
6. **External Link**: Link ke resource eksternal

### Tips Penggunaan

- Strukturkan materi secara logis per minggu
- Gunakan berbagai tipe aktivitas untuk variasi pembelajaran
- Publish aktivitas secara bertahap
- Berikan learning objectives yang jelas per minggu

---

## Sistem Assignment

### Overview

Sistem assignment memungkinkan dosen untuk membuat tugas, mahasiswa untuk submit tugas, dan dosen untuk menilai tugas dengan sistem rubric.

### Fitur Utama

- **Assignment Creation**: Buat assignment dengan deadline
- **File Submission**: Mahasiswa submit file via MinIO
- **Late Submission Tracking**: Lacak submission terlambat
- **Manual Grading**: Penilaian manual dengan feedback
- **Rubric Grading**: Penilaian berbasis rubric dengan criteria
- **Bulk Grading**: Penilaian massal untuk efisiensi
- **Grade History**: Audit trail perubahan nilai

### Rubric System

Rubric memungkinkan penilaian yang terstruktur dan konsisten:

- **Criteria**: Aspek yang dinilai (misal: Content, Organization, Grammar)
- **Levels**: Tingkat pencapaian (misal: Excellent, Good, Fair, Poor)
- **Points**: Nilai untuk setiap level
- **Descriptions**: Deskripsi untuk setiap level

### Tips Penggunaan

- Berikan deskripsi assignment yang jelas dan detail
- Atur deadline yang realistis
- Gunakan rubric untuk penilaian yang konsisten
- Berikan feedback yang konstruktif
- Manfaatkan bulk grading untuk efisiensi

---

## Sistem Ujian (Exam)

### Overview

Sistem exam menyediakan platform ujian online dengan berbagai tipe soal, timer, dan fitur anti-cheating.

### Tipe Soal

1. **Multiple Choice**: Pilihan ganda dengan satu jawaban benar
2. **True/False**: Pernyataan benar atau salah
3. **Short Answer**: Jawaban singkat (biasanya 1-2 kalimat)
4. **Essay**: Jawaban panjang dengan penjelasan

### Fitur Utama

- **Question Bank**: Bank soal untuk reusable questions
- **Question Import**: Import soal dari Excel
- **Timer**: Timer countdown dengan auto-submit
- **Question Shuffling**: Acak urutan soal
- **Anti-Cheat**: Log aktivitas untuk mendeteksi kecurangan
- **Auto Grading**: Penilaian otomatis untuk MCQ
- **Multiple Attempts**: Beberapa kali percobaan (opsional)
- **Results Display**: Tampilkan hasil dengan penjelasan

### Question Bank

Question bank memungkinkan:
- Menyimpan soal untuk digunakan kembali
- Kategorisasi soal berdasarkan topik
- Tagging soal untuk pencarian mudah
- Import/export soal dari Excel

### Tips Penggunaan

- Gunakan question bank untuk efisiensi
- Buat soal dengan tingkat kesulitan bervariasi
- Atur durasi yang cukup untuk exam
- Aktifkan anti-cheat untuk exam penting
- Gunakan question shuffling untuk mencegah kecurangan

---

## Forum Diskusi

### Overview

Forum diskusi menyediakan platform interaktif untuk diskusi antara dosen dan mahasiswa.

### Fitur Utama

- **Threaded Replies**: Balasan berlapis untuk diskusi terstruktur
- **User Mentions**: Mention user dengan @username
- **File Attachments**: Upload file pada thread dan reply
- **Thread Pinning**: Sematkan thread penting
- **Thread Locking**: Kunci thread yang tidak aktif
- **Best Answer**: Pilih jawaban terbaik
- **Search**: Cari thread dan konten

### Tips Penggunaan

- Buat thread dengan judul yang jelas
- Gunakan mention untuk notifikasi user spesifik
- Pilih best answer untuk thread yang sudah selesai
- Pin thread penting untuk visibility
- Lock thread yang sudah tidak relevan

---

## Sistem Pengumuman

### Overview

Sistem pengumuman memungkinkan admin dan dosen untuk mengirim pengumuman ke mahasiswa.

### Fitur Utama

- **Course Announcements**: Pengumuman spesifik course
- **Global Announcements**: Pengumuman sistem-wide
- **Priority System**: Normal, High, Urgent
- **Validity Period**: Periode aktif pengumuman
- **Read Tracking**: Lacak siapa yang sudah membaca
- **Attachments**: Lampirkan file pada pengumuman

### Tips Penggunaan

- Gunakan priority sesuai urgensi
- Atur validity period untuk pengumuman waktu-limited
- Berikan judul yang jelas dan informatif
- Gunakan attachments untuk dokumen penting

---

## Kalender Kegiatan

### Overview

Kalender kegiatan menyediakan visualisasi jadwal dan pengingat untuk berbagai kegiatan akademik.

### Fitur Utama

- **Event Creation**: Buat event dengan detail lengkap
- **Event Categories**: Perkuliahan, Assignment, Quiz, dll
- **Target Audience**: Semua mahasiswa atau mahasiswa course tertentu
- **Online Meeting**: Support meeting link
- **Automatic Events**: Event otomatis dari assignment/exam deadlines
- **Upcoming Events**: Panel event yang akan datang

### Kategori Event

- **PERKULIAHAN**: Jadwal perkuliahan
- **ASSIGNMENT**: Deadline assignment
- **QUIZ**: Jadwal quiz
- **EXAM**: Jadwal ujian
- **MEETING**: Meeting atau konsultasi
- **OTHER**: Event lainnya

### Tips Penggunaan

- Gunakan kategori yang sesuai untuk organisasi
- Atur target audience dengan tepat
- Manfaatkan automatic events untuk deadline
- Berikan deskripsi event yang jelas

---

## Gradebook

### Overview

Gradebook menyediakan sistem penilaian komprehensif dengan perhitungan nilai akhir dan audit trail.

### Fitur Utama

- **Customizable Weights**: Atur bobot per komponen nilai
- **Final Score Calculation**: Perhitungan nilai akhir otomatis
- **Letter Grade**: Konversi nilai ke huruf (A, B, C, dll)
- **Grade History**: Audit trail perubahan nilai
- **Bulk Update**: Update nilai massal
- **Export**: Export ke Excel, CSV, PDF
- **Progress Tracking**: Lacak progress mahasiswa

### Komponen Nilai

- **Assignment**: Nilai tugas
- **Quiz**: Nilai kuis
- **UTS**: Nilai Ujian Tengah Semester
- **UAS**: Nilai Ujian Akhir Semester
- **Other**: Nilai komponen lain

### Tips Penggunaan

- Atur bobot sesuai kebijakan institusi
- Gunakan bulk update untuk efisiensi
- Export gradebook secara berkala untuk backup
- Review grade history untuk audit

---

## File Storage Pribadi

### Overview

File storage pribadi menyediakan ruang penyimpanan untuk file pribadi setiap user dengan quota management.

### Fitur Utama

- **Personal Storage**: Ruang penyimpanan pribadi
- **Quota Management**: Batas storage per user
- **Folder Structure**: Organisasi file dengan folder
- **File Upload**: Upload file via MinIO
- **File Manager**: Interface untuk kelola file

### Tips Penggunaan

- Organisasi file dengan folder yang baik
- Monitor quota usage
- Hapus file yang tidak diperlukan
- Gunakan untuk backup dokumen penting

---

## Troubleshooting

### Masalah Umum

#### Tidak Bisa Login

**Masalah**: Tidak bisa login ke sistem

**Solusi**:
1. Pastikan email dan password benar
2. Cek koneksi internet
3. Pastikan backend server berjalan
4. Clear browser cache
5. Coba login dengan browser lain

#### Error Saat Upload File

**Masalah**: File tidak bisa diupload

**Solusi**:
1. Pastikan MinIO service berjalan
2. Cek koneksi internet
3. Pastikan file size tidak melebihi limit
4. Cek file format yang didukung
5. Coba upload file yang lebih kecil

#### Assignment Tidak Bisa Disubmit

**Masalah**: Tidak bisa submit assignment

**Solusi**:
1. Pastikan deadline belum lewat
2. Cek koneksi internet
3. Pastikan file tidak korup
4. Coba upload ulang file
5. Hubungi dosen jika masih bermasalah

#### Exam Tidak Bisa Dimulai

**Masalah**: Tidak bisa memulai exam

**Solusi**:
1. Pastikan waktu sudah dalam periode exam
2. Cek koneksi internet
3. Pastikan browser compatible
4. Clear browser cache
5. Hubungi dosen jika masih bermasalah

#### Nilai Tidak Muncul di Gradebook

**Masalah**: Nilai tidak muncul di gradebook

**Solusi**:
1. Pastikan dosen sudah menilai
2. Refresh halaman gradebook
3. Cek koneksi internet
4. Hubungi dosen untuk konfirmasi

#### Notifikasi Tidak Muncul

**Masalah**: Tidak menerima notifikasi

**Solusi**:
1. Pastikan Redis service berjalan
2. Cek browser notification settings
3. Refresh halaman
4. Cek tab Notifications

#### Database Connection Error

**Masalah**: Error koneksi database

**Solusi**:
1. Pastikan PostgreSQL service berjalan
2. Cek DATABASE_URL di .env
3. Restart backend server
4. Cek docker services status

#### MinIO Connection Error

**Masalah**: Error koneksi MinIO

**Solusi**:
1. Pastikan MinIO service berjalan
2. Cek MinIO configuration di .env
3. Akses MinIO Console di http://localhost:9001
4. Cek bucket configuration

### Error Messages

#### "401 Unauthorized"

**Artinya**: Session tidak valid atau expired

**Solusi**: Login ulang

#### "403 Forbidden"

**Artinya**: Tidak memiliki akses ke resource

**Solusi**: Hubungi admin untuk akses

#### "404 Not Found"

**Artinya**: Resource tidak ditemukan

**Solusi**: Cek URL atau hubungi admin

#### "500 Internal Server Error"

**Artinya**: Error di server

**Solusi**: Hubungi admin atau cek server logs

#### "503 Service Unavailable"

**Artinya**: Service tidak tersedia

**Solusi**: Tunggu beberapa saat atau hubungi admin

### Tips Umum

- Selalu refresh halaman jika mengalami error
- Clear browser cache secara berkala
- Gunakan browser yang support (Chrome, Firefox, Safari, Edge)
- Pastikan koneksi internet stabil
- Update browser ke versi terbaru
- Disable extensions yang mungkin interfere

---

## FAQ (Pertanyaan yang Sering Diajukan)

### General

**Q: Apa itu E-Course LMS?**  
A: E-Course LMS adalah Learning Management System untuk manajemen pembelajaran online dengan fitur lengkap seperti course management, assignment, exam, forum, dan gradebook.

**Q: Apakah E-Course LMS gratis?**  
A: E-Course LMS adalah platform private. Hubungi admin untuk informasi lisensi.

**Q: Apakah E-Course LMS support mobile?**  
A: Ya, E-Course LMS memiliki responsive design yang bekerja baik di mobile.

### Account & Authentication

**Q: Bagaimana cara membuat akun?**  
A: Anda bisa registrasi sendiri atau dibuatkan oleh admin. Gunakan fitur "Daftar" di halaman login.

**Q: Saya lupa password, bagaimana cara reset?**  
A: Klik "Lupa Password?" di halaman login dan ikuti instruksi yang dikirim ke email.

**Q: Apakah bisa mengubah email?**  
A: Untuk saat ini, pengubahan email harus melalui admin.

**Q: Apakah ada 2FA?**  
A: Ya, sistem mendukung 2FA untuk keamanan tambahan.

### Course & Enrollment

**Q: Bagaimana cara enroll ke course?**  
A: Gunakan enrollment code yang diberikan dosen atau minta dosen untuk menambahkan Anda secara langsung.

**Q: Apakah bisa unenroll dari course?**  
A: Ya, Anda bisa unenroll dari course di halaman course.

**Q: Apakah ada batas jumlah course yang bisa diikuti?**  
A: Tidak ada batas teknis, namun institusi mungkin memiliki kebijakan sendiri.

**Q: Bagaimana cara mendapatkan enrollment code?**  
A: Hubungi dosen pengajar course untuk mendapatkan enrollment code.

### Assignment & Exam

**Q: Apakah bisa submit assignment setelah deadline?**  
A: Bisa, namun akan ditandai sebagai "Late Submission" dan mungkin mendapatkan penalti.

**Q: Apakah bisa retake exam?**  
A: Tergantung pengaturan exam oleh dosen. Beberapa exam mengizinkan multiple attempts.

**Q: Bagaimana jika internet putus saat mengerjakan exam?**  
A: Jawaban Anda akan tersimpan secara lokal. Saat koneksi kembali, sistem akan sinkronisasi.

**Q: Apakah bisa download soal exam?**  
A: Tidak, soal exam tidak bisa didownload untuk mencegah kecurangan.

### Grading

**Q: Bagaimana nilai dihitung?**  
A: Nilai dihitung berdasarkan bobot yang ditetapkan dosen untuk setiap komponen (assignment, quiz, UTS, UAS, dll).

**Q: Kapan nilai akan muncul?**  
A: Nilai akan muncul setelah dosen menilai dan publish hasil.

**Q: Apakah bisa melihat detail penilaian?**  
A: Ya, Anda bisa melihat detail penilaian termasuk feedback di gradebook.

**Q: Bagaimana jika ada protes terhadap nilai?**  
A: Hubungi dosen pengajar untuk diskusi lebih lanjut.

### Technical

**Q: Browser apa yang support?**  
A: Chrome, Firefox, Safari, dan Edge versi terbaru.

**Q: Apakah butuh instalasi software tambahan?**  
A: Tidak, cukup browser modern. Untuk admin perlu Docker untuk infrastructure.

**Q: Apakah data aman?**  
A: Ya, sistem menggunakan enkripsi dan berbagai fitur keamanan untuk melindungi data.

**Q: Apakah bisa export data?**  
A: Ya, Anda bisa export gradebook dan beberapa data lainnya dalam format Excel, CSV, atau PDF.

### Troubleshooting

**Q: Saya mengalami error, apa yang harus dilakukan?**  
A: Cek section Troubleshooting di dokumentasi ini atau hubungi admin.

**Q: Halaman tidak bisa diakses, apa yang harus dilakukan?**  
A: Refresh halaman, clear cache, atau coba browser lain.

**Q: File tidak bisa diupload, apa yang harus dilakukan?**  
A: Cek koneksi internet, file size, dan format file yang didukung.

---

## Kontak dan Dukungan

### Dukungan Teknis

Jika Anda mengalami masalah atau memiliki pertanyaan:

- **Email**: support@ecourse.ac.id
- **Telepon**: +62-XXX-XXXX-XXXX
- **Jam Operasional**: Senin - Jumat, 08:00 - 17:00 WIB

### Dokumentasi Tambahan

Untuk dokumentasi teknis lebih detail, silakan lihat:
- **README.md**: Overview project dan quick start
- **DOKUMENTASI_PROYEK.md**: Dokumentasi teknis lengkap

### Resource Tambahan

- **API Documentation**: http://localhost:3001/api/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)

### Feedback

Kami menghargai feedback Anda untuk perbaikan sistem. Kirimkan feedback ke:
- **Email**: feedback@ecourse.ac.id
- **Form Feedback**: Tersedia di dalam aplikasi

---

## Appendix

### Glossary

- **LMS**: Learning Management System
- **CRUD**: Create, Read, Update, Delete
- **RBAC**: Role-Based Access Control
- **DTO**: Data Transfer Object
- **JWT**: JSON Web Token
- **ORM**: Object-Relational Mapping
- **MCQ**: Multiple Choice Question
- **UTS**: Ujian Tengah Semester
- **UAS**: Ujian Akhir Semester

### Shortcut Keys

- **Ctrl/Cmd + K**: Quick search
- **Ctrl/Cmd + /**: Buka help
- **Esc**: Tutup dialog/modal
- **Enter**: Submit form

### Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | Full Support |
| Firefox | 88+ | Full Support |
| Safari | 14+ | Full Support |
| Edge | 90+ | Full Support |
| Opera | 76+ | Partial Support |

### File Format Support

| Tipe | Format | Status |
|-----|--------|--------|
| Document | PDF, DOC, DOCX | Support |
| Presentation | PPT, PPTX | Support |
| Spreadsheet | XLS, XLSX, CSV | Support |
| Image | JPG, PNG, GIF | Support |
| Video | MP4, WebM | Support |
| Audio | MP3, WAV | Limited |

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Full LMS functionality
- 23/23 heuristic evaluation compliance
- Production-ready features

---

**Dokumentasi ini diperbarui terakhir pada: 22 Agustus 2026**

**Untuk informasi lebih lanjut atau pertanyaan, silakan hubungi tim dukungan kami.**

---

© 2026 E-Course Learning Management System. All rights reserved.