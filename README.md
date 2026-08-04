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
cd "e-course 2"

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
- **PostgreSQL** → `localhost:5433` (mapped from container port 5432)
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

## Known Issues & TODOs

### Frontend Issues

1. **Activity Management (week-accordion.tsx)**
   - Edit activity functionality implemented
   - Delete activity functionality implemented (in activity-card.tsx)
   - Duplicate activity functionality implemented (in activity-card.tsx)
   - Move activity functionality removed (simplified to focus on core features)

2. **Activity Publishing (activity-card.tsx)**
   - Publish activity functionality implemented
   - Unpublish activity functionality implemented

3. **Week Creation (course-detail-client.tsx)**
   - Create week dialog implemented ✅

4. **Exam Question Ordering (exam-questions-client.tsx)**
   - API call to update question order not implemented (line 192)

### Setup Notes

- **PostgreSQL Port**: Database runs on port `5433` (not 5432) due to Docker mapping
- **Environment Files**: Make sure to copy `.env.example` to all three locations (root, backend, frontend)
- **Dependencies**: Run `npm install` in both `backend` and `frontend` directories separately
- **Database Migration**: Must run `npm run prisma:migrate` before seeding data
- **Prisma Client**: Must run `npm run prisma:generate` after schema changes

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

---

# Dokumentasi Lengkap Proyek E-Course LMS

## 📋 Table of Contents

1. [Overview Proyek](#overview-proyek)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Alur Proyek](#alur-proyek)
4. [Struktur Direktori](#struktur-direktori)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Fitur yang Sudah Implementasi](#fitur-yang-sudah-implementasi)
9. [Fitur yang Perlu Ditambahkan](#fitur-yang-perlu-ditambahkan)
10. [Known Issues & Bugs](#known-issues--bugs)
11. [Rekomendasi Perbaikan](#rekomendasi-perbaikan)
12. [Best Practices](#best-practices)
13. [Deployment Guide](#deployment-guide)

---

## Overview Proyek

### Deskripsi
E-Course adalah **Learning Management System (LMS)** full-stack yang dirancang khusus untuk kebutuhan akademik dengan fokus pada **23 indikator heuristic evaluation** untuk e-Learning. Platform ini menyediakan solusi komprehensif untuk manajemen pembelajaran online termasuk course management, assignment, exams, forum diskusi, dan sistem penilaian.

### Tech Stack

| Layer | Teknologi | Versi | Deskripsi |
|-------|-----------|-------|-----------|
| **Frontend** | Next.js | 16.2.10 | React framework dengan App Router |
| | TypeScript | 5 | Type safety |
| | Tailwind CSS | 4 | Utility-first CSS framework |
| | shadcn/ui | Latest | Component library berbasis Radix UI |
| | NextAuth.js | 5.0.0-beta.31 | Authentication library |
| **Backend** | NestJS | 11.0.1 | Node.js framework dengan arsitektur modular |
| | TypeScript | 5.7.3 | Type safety |
| | Prisma ORM | 7.8.0 | Database ORM dengan type safety |
| **Database** | PostgreSQL | 16-alpine | Relational database |
| **Cache & Queue** | Redis | 7-alpine | In-memory data store |
| | BullMQ | 5.80.9 | Job queue based on Redis |
| **Storage** | MinIO | Latest | S3-compatible object storage |
| **Auth** | JWT | - | JSON Web Token untuk backend auth |
| | NextAuth | - | OAuth & session management |

### Fitur Utama

- **Multi-role Authentication**: Admin, Dosen, Mahasiswa dengan RBAC
- **Course Management**: CRUD courses dengan enrollment code
- **Learning Modules**: Upload dan manage materi pembelajaran
- **Assignment System**: Tugas dengan deadline dan submission
- **Exam System**: Ujian dengan berbagai tipe soal (MCQ, Essay, dll)
- **Forum Diskusi**: Diskusi per course dengan mentions
- **Gradebook**: Sistem penilaian dengan history tracking
- **Calendar**: Kalender akademik dan personal
- **Notifications**: System notifications dengan BullMQ
- **Private Storage**: File storage personal dengan quota
- **Anti-cheat**: Logging untuk deteksi kecurangan ujian

---

## Arsitektur Sistem

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Next.js 16  │  │  shadcn/ui   │  │  NextAuth    │     │
│  │  App Router  │  │  Components  │  │  Session     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
┌───────────────────────────┴─────────────────────────────────┐
│                         Backend                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   NestJS     │  │   Prisma     │  │   BullMQ     │     │
│  │   Modules    │  │   ORM        │  │   Queue      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    Infrastructure                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │    Redis     │  │    MinIO     │     │
│  │   Database   │  │    Cache     │  │   Storage    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Backend Architecture (NestJS)

Backend menggunakan arsitektur modular dengan pattern:

- **Modules**: Setiap fitur dalam module terpisah (Auth, Courses, Exams, dll)
- **Controllers**: Handle HTTP requests dan routing
- **Services**: Business logic dan data manipulation
- **DTOs**: Data Transfer Objects untuk validation
- **Guards**: Route protection dan authorization
- **Interceptors**: Response transformation dan logging
- **Filters**: Exception handling

### Frontend Architecture (Next.js)

Frontend menggunakan Next.js 16 App Router dengan:

- **App Router**: File-based routing di `app/` directory
- **Server Components**: Default rendering di server
- **Client Components**: Komponen interaktif dengan `"use client"`
- **Route Groups**: Organisasi routes dengan `(group)` syntax
- **Middleware**: Route protection di `middleware.ts`
- **API Routes**: Backend proxy di `app/api/`

---

## Alur Proyek

### Development Flow

```
1. Setup Environment
   ↓
2. Start Infrastructure (Docker)
   ↓
3. Backend Setup
   - Install dependencies
   - Generate Prisma client
   - Run migrations
   - Seed data
   - Start dev server
   ↓
4. Frontend Setup
   - Install dependencies
   - Configure environment
   - Start dev server
   ↓
5. Development
   - Backend: NestJS with hot reload
   - Frontend: Next.js with hot reload
   - Database: Prisma migrations
   ↓
6. Testing & Deployment
```

### User Flow

#### Authentication Flow
```
User → Login Page → NextAuth → Backend API → JWT Token → Session → Dashboard
```

#### Course Enrollment Flow
```
Mahasiswa → Dashboard → Enter Course Code → Validate → Create Enrollment → Access Course
```

#### Assignment Submission Flow
```
Dosen → Create Assignment → Set Deadline → Mahasiswa → View Assignment → Upload File → Submit → Dosen → Grade → Feedback
```

#### Exam Flow
```
Dosen → Create Exam → Add Questions → Publish → Mahasiswa → Start Exam → Timer → Submit → Auto/Manual Grade → Results
```

---

## Struktur Direktori

### Root Directory
```
z:/
├── docker-compose.yml          # Infrastructure services
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── .gitattributes              # Git attributes
├── README.md                   # Project documentation
├── COURSE_ENROLLMENT_IMPLEMENTATION.md  # Feature documentation
├── backend/                    # NestJS backend
└── frontend/                   # Next.js frontend
```

### Backend Structure
```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   ├── seed.ts                # Demo data seeder
│   └── migrations/            # Database migrations
├── src/
│   ├── main.ts                # Application entry point
│   ├── app.module.ts          # Root module
│   ├── auth/                  # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── decorators/        # Custom decorators (@Roles, @CurrentUser)
│   │   ├── dto/              # Data transfer objects
│   │   ├── guards/           # Auth guards (JwtAuthGuard, RolesGuard)
│   │   └── strategies/       # Passport strategies
│   ├── courses/               # Course management
│   │   ├── courses.controller.ts
│   │   ├── courses.service.ts
│   │   ├── courses.module.ts
│   │   └── dto/
│   ├── modules/              # Learning modules
│   ├── assignments/           # Assignment management
│   ├── exams/                 # Exam system
│   ├── weeks/                 # Week management
│   ├── activities/            # Activity management
│   ├── forum/                 # Forum discussion
│   ├── notifications/         # Notification system
│   ├── calendar/              # Calendar events
│   ├── gradebook/             # Grading system
│   ├── private-files/         # Private file storage
│   ├── question-banks/       # Question bank management
│   ├── announcements/         # Announcement system
│   ├── dashboard/             # Dashboard endpoints
│   ├── course-progress/       # Progress tracking
│   ├── course-categories/     # Course categories
│   ├── storage/               # MinIO integration
│   ├── common/                # Shared utilities
│   │   ├── filters/          # Exception filters
│   │   ├── interceptors/     # Response interceptors
│   │   └── interfaces/       # Shared interfaces
│   └── prisma/                # Prisma client
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env
```

### Frontend Structure
```
frontend/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   ├── globals.css       # Global styles
│   │   ├── error.tsx         # Error boundary
│   │   ├── not-found.tsx     # 404 page
│   │   ├── (auth)/           # Auth route group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── admin/            # Admin dashboard
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── courses/
│   │   │   ├── announcements/
│   │   │   ├── calendar/
│   │   │   ├── exams/
│   │   │   ├── gradebook/
│   │   │   ├── logs/
│   │   │   ├── question-banks/
│   │   │   └── storage/
│   │   ├── dosen/            # Lecturer dashboard
│   │   │   ├── dashboard/
│   │   │   ├── courses/
│   │   │   ├── forum/
│   │   │   ├── gradebook/
│   │   │   ├── announcements/
│   │   │   ├── calendar/
│   │   │   └── storage/
│   │   ├── mahasiswa/        # Student dashboard
│   │   │   ├── dashboard/
│   │   │   ├── courses/
│   │   │   ├── exams/
│   │   │   ├── forum/
│   │   │   ├── grades/
│   │   │   ├── calendar/
│   │   │   └── storage/
│   │   ├── 403/              # Forbidden page
│   │   └── api/              # API routes (proxy)
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (more UI components)
│   │   ├── dashboard/        # Dashboard components
│   │   ├── courses/          # Course-related components
│   │   ├── assignments/      # Assignment components
│   │   ├── exams/            # Exam components
│   │   ├── forum/            # Forum components
│   │   ├── calendar/         # Calendar components
│   │   ├── notifications/    # Notification components
│   │   ├── announcements/    # Announcement components
│   │   ├── private-files/    # File storage components
│   │   ├── profile/          # Profile components
│   │   ├── course-detail/    # Course detail components
│   │   ├── modules/          # Module components
│   │   ├── layout/           # Layout components
│   │   ├── providers.tsx     # Context providers
│   │   └── session-provider.tsx
│   ├── lib/                  # Utility functions
│   ├── auth.ts               # NextAuth configuration
│   └── middleware.ts         # Route protection middleware
├── public/                   # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
└── .env.local
```

---

## Database Schema

### Core Entities

#### User
- **Fields**: id, name, email, password, role, avatarUrl, storageQuotaUsed, storageQuotaLimit
- **Relations**: coursesTaught, enrollments, assignmentSubmissions, examAttempts, calendarEvents, privateFiles, forumThreads, forumReplies, notifications, activityLogs, grades, gradeChanges, announcements
- **Roles**: ADMIN, DOSEN, MAHASISWA

#### Course
- **Fields**: id, name, code, enrollmentCode, enrollmentEnabled, description, learningObjectives, thumbnailColor, isLinear, isActive, instructorId, categoryId
- **Relations**: instructor, category, enrollments, modules, assignments, exams, calendarEvents, forumThreads, weeks, questionBanks, settings, grades, announcements

#### Enrollment
- **Fields**: id, userId, courseId, role, joinedAt
- **Roles**: STUDENT, ASSISTANT
- **Constraints**: Unique(userId, courseId)

#### Week
- **Fields**: id, courseId, weekNumber, title, startDate, endDate, order
- **Relations**: course, activities, exams
- **Constraints**: Unique(courseId, weekNumber)

#### Activity
- **Fields**: id, weekId, type, title, description, status, order, metadata, publishedAt
- **Types**: MATERIAL, ASSIGNMENT, QUIZ, FORUM, VIDEO, EXTERNAL_LINK
- **Status**: DRAFT, PUBLISHED

#### Module
- **Fields**: id, courseId, title, description, learningObjectives, order
- **Relations**: course, files

#### ModuleFile
- **Fields**: id, moduleId, fileName, fileUrl, fileType, fileSize, uploadedAt
- **Types**: PDF, VIDEO, DOCUMENT, SLIDE, OTHER

#### Assignment
- **Fields**: id, courseId, title, description, deadline, maxScore
- **Relations**: course, submissions

#### AssignmentSubmission
- **Fields**: id, assignmentId, studentId, fileUrl, fileName, submittedAt, score, feedback, rubricNotes, status
- **Status**: NOT_SUBMITTED, SUBMITTED, LATE, GRADED
- **Constraints**: Unique(assignmentId, studentId)

#### Exam
- **Fields**: id, courseId, weekId, title, description, category, startTime, deadline, duration, maxScore, maxAttempts, passingGrade, isPublished, showResults, showExplanation, shuffleQuestions, shuffleOptions, allowReview, allowBack, autoSubmit
- **Categories**: QUIZ, UTS, UAS, GENERAL
- **Relations**: course, week, questions, attempts

#### Question
- **Fields**: id, examId, questionBankId, type, questionText, attachmentUrl, points, order, difficulty, explanation, rubric, maxChars, caseSensitive, tolerance, allowMultiple, isFromBank
- **Types**: MULTIPLE_CHOICE, ESSAY, TRUE_FALSE, SHORT_ANSWER
- **Difficulty**: EASY, MEDIUM, HARD
- **Relations**: exam, questionBank, options, answers, tags

#### QuestionOption
- **Fields**: id, questionId, optionText, isCorrect, order
- **Relations**: question, answers

#### QuestionBank
- **Fields**: id, courseId, title, description, topic, difficulty, questionType
- **Relations**: course, questions

#### ExamAttempt
- **Fields**: id, examId, studentId, attemptNumber, startedAt, submittedAt, totalScore, passed, gradingStatus, status, examCheatLog, autoSavedData
- **Status**: NOT_STARTED, IN_PROGRESS, SUBMITTED, GRADED
- **GradingStatus**: PENDING, IN_PROGRESS, COMPLETED
- **Constraints**: Unique(examId, studentId, attemptNumber)

#### Answer
- **Fields**: id, attemptId, questionId, answerText, selectedOptionId, score, feedback
- **Relations**: attempt, question, selectedOption
- **Constraints**: Unique(attemptId, questionId)

#### CalendarEvent
- **Fields**: id, title, description, startDate, endDate, startTime, endTime, location, isOnline, meetingLink, category, color, type, targetAudience, relatedActivityType, relatedActivityId, isPublished, attachments, userId, courseId
- **Types**: DEADLINE, PERSONAL_NOTE, ANNOUNCEMENT
- **Categories**: PERKULIAHAN, MATERI_BARU, ASSIGNMENT, QUIZ, UTS, UAS, SEMINAR, PROJECT, MEETING, DEADLINE, PENGUMUMAN_AKADEMIK
- **TargetAudience**: ALL_STUDENTS, COURSE_STUDENTS

#### PrivateFile
- **Fields**: id, userId, fileName, fileUrl, fileSize, folderPath, mimeType
- **Relations**: user

#### ForumThread
- **Fields**: id, courseId, authorId, title, content, isPinned, isLocked, lockedAt, lockedBy, bestReplyId
- **Relations**: course, author, replies, replies, attachments, mentions, bestReply, locker

#### ForumReply
- **Fields**: id, threadId, authorId, content
- **Relations**: thread, author, attachments, mentions, bestThread

#### ForumAttachment
- **Fields**: id, threadId, replyId, fileName, fileUrl, fileSize, mimeType
- **Relations**: thread, reply

#### ForumMention
- **Fields**: id, threadId, replyId, mentionedUserId, mentionedBy
- **Relations**: thread, reply, mentionedUser, mentioner

#### Notification
- **Fields**: id, userId, type, title, message, link, isRead
- **Types**: DEADLINE_REMINDER, EXAM_REMINDER, GRADE_RELEASED, FORUM_REPLY, SYSTEM, COURSE_CREATED, MATERIAL_PUBLISHED, ASSIGNMENT_CREATED, QUIZ_CREATED, EXAM_CREATED, EVENT_CREATED, SCHEDULE_CHANGED, ANNOUNCEMENT_CREATED
- **Relations**: user

#### ActivityLog
- **Fields**: id, userId, action, entity, entityId, metadata, ipAddress
- **Relations**: user

#### CourseSettings
- **Fields**: id, courseId, passingGrade, assignmentWeight, quizWeight, utsWeight, uasWeight, otherWeight
- **Relations**: course
- **Constraints**: Unique(courseId)

#### Grade
- **Fields**: id, courseId, studentId, assignmentScore, quizScore, utsScore, uasScore, otherScore, finalScore, passed, completionPercentage, calculatedAt
- **Relations**: course, student, histories
- **Constraints**: Unique(courseId, studentId)

#### GradeHistory
- **Fields**: id, gradeId, changedBy, fieldName, oldValue, newValue, changeReason, changedAt
- **Relations**: grade, changer

#### Announcement
- **Fields**: id, title, content, attachments, publishedAt, validFrom, validUntil, isPublished, priority, courseId, authorId
- **Relations**: author, course, readStatus

#### AnnouncementRead
- **Fields**: id, announcementId, userId, readAt
- **Relations**: announcement, user
- **Constraints**: Unique(announcementId, userId)

---

## API Endpoints

### Base URL
- Development: `http://localhost:3001/api`
- Production: `[TBD]`

### Authentication Endpoints

#### POST `/auth/register`
- **Description**: Register new user
- **Body**: `{ name, email, password, role }`
- **Response**: User object without password

#### POST `/auth/login`
- **Description**: Login user
- **Body**: `{ email, password }`
- **Response**: `{ access_token, user }`

#### POST `/auth/refresh`
- **Description**: Refresh access token
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ access_token }`

#### GET `/auth/profile`
- **Description**: Get current user profile
- **Headers**: `Authorization: Bearer <token>`
- **Response**: User object

### Course Endpoints

#### GET `/courses`
- **Description**: Get all courses (filtered by role)
- **Query**: `?page=1&limit=10&search=keyword`
- **Response**: Paginated course list

#### GET `/courses/:id`
- **Description**: Get course by ID
- **Params**: `id`
- **Response**: Course object with relations

#### POST `/courses`
- **Description**: Create new course (Admin/Dosen only)
- **Body**: Course data
- **Response**: Created course

#### PUT `/courses/:id`
- **Description**: Update course (Instructor/Admin only)
- **Params**: `id`
- **Body**: Partial course data
- **Response**: Updated course

#### DELETE `/courses/:id`
- **Description**: Delete course (Admin only)
- **Params**: `id`
- **Response**: Success message

#### POST `/courses/:id/enroll`
- **Description**: Enroll in course with code
- **Params**: `id`
- **Body**: `{ enrollmentCode }`
- **Response**: Enrollment object

### Module Endpoints

#### GET `/courses/:courseId/modules`
- **Description**: Get all modules for a course
- **Params**: `courseId`
- **Response**: Module list

#### POST `/courses/:courseId/modules`
- **Description**: Create new module (Instructor only)
- **Params**: `courseId`
- **Body**: Module data
- **Response**: Created module

#### POST `/modules/:moduleId/files`
- **Description**: Upload file to module (Instructor only)
- **Params**: `moduleId`
- **Body**: FormData with file
- **Response**: Created module file

### Assignment Endpoints

#### GET `/courses/:courseId/assignments`
- **Description**: Get all assignments for a course
- **Params**: `courseId`
- **Response**: Assignment list

#### POST `/courses/:courseId/assignments`
- **Description**: Create assignment (Instructor only)
- **Params**: `courseId`
- **Body**: Assignment data
- **Response**: Created assignment

#### POST `/assignments/:id/submit`
- **Description**: Submit assignment (Student only)
- **Params**: `id`
- **Body**: `{ fileUrl, fileName }`
- **Response**: Submission object

#### POST `/assignments/:id/grade/:submissionId`
- **Description**: Grade submission (Instructor only)
- **Params**: `id, submissionId`
- **Body**: `{ score, feedback, rubricNotes }`
- **Response**: Graded submission

### Exam Endpoints

#### GET `/courses/:courseId/exams`
- **Description**: Get all exams for a course
- **Params**: `courseId`
- **Response**: Exam list

#### POST `/courses/:courseId/exams`
- **Description**: Create exam (Instructor only)
- **Params**: `courseId`
- **Body**: Exam data
- **Response**: Created exam

#### POST `/exams/:id/start`
- **Description**: Start exam attempt (Student only)
- **Params**: `id`
- **Response**: Attempt object with questions

#### POST `/exams/:id/submit`
- **Description**: Submit exam (Student only)
- **Params**: `id`
- **Body**: `{ answers }`
- **Response**: Submitted attempt

#### POST `/exams/:id/questions`
- **Description**: Add question to exam (Instructor only)
- **Params**: `id`
- **Body**: Question data
- **Response**: Created question

### Forum Endpoints

#### GET `/courses/:courseId/forum`
- **Description**: Get all forum threads for a course
- **Params**: `courseId`
- **Response**: Thread list

#### POST `/courses/:courseId/forum`
- **Description**: Create new thread
- **Params**: `courseId`
- **Body**: `{ title, content, attachments }`
- **Response**: Created thread

#### POST `/forum/:threadId/replies`
- **Description**: Reply to thread
- **Params**: `threadId`
- **Body**: `{ content, attachments }`
- **Response**: Created reply

### Gradebook Endpoints

#### GET `/courses/:courseId/gradebook`
- **Description**: Get gradebook for course (Instructor only)
- **Params**: `courseId`
- **Response**: Gradebook data

#### GET `/courses/:courseId/grades/:studentId`
- **Description**: Get student grades (Student/Instructor only)
- **Params**: `courseId, studentId`
- **Response**: Student grade data

#### POST `/courses/:courseId/grades/:studentId`
- **Description**: Update student grade (Instructor only)
- **Params**: `courseId, studentId`
- **Body**: Grade data
- **Response**: Updated grade

### Notification Endpoints

#### GET `/notifications`
- **Description**: Get user notifications
- **Query**: `?unreadOnly=true`
- **Response**: Notification list

#### PUT `/notifications/:id/read`
- **Description**: Mark notification as read
- **Params**: `id`
- **Response**: Updated notification

#### PUT `/notifications/read-all`
- **Description**: Mark all notifications as read
- **Response**: Success message

### Calendar Endpoints

#### GET `/calendar`
- **Description**: Get calendar events
- **Query**: `?start=YYYY-MM-DD&end=YYYY-MM-DD`
- **Response**: Event list

#### POST `/calendar`
- **Description**: Create calendar event
- **Body**: Event data
- **Response**: Created event

### Storage Endpoints

#### POST `/storage/upload`
- **Description**: Get presigned URL for upload
- **Body**: `{ fileName, fileType, fileSize }`
- **Response**: `{ uploadUrl, fileUrl }`

#### GET `/storage/download/:key`
- **Description**: Get presigned URL for download
- **Params**: `key`
- **Response**: `{ downloadUrl }`

---

## Frontend Components

### UI Components (shadcn/ui)

Located in `src/components/ui/`:

- **button.tsx**: Button component with variants (default, destructive, outline, ghost, link)
- **card.tsx**: Card container with header, content, footer
- **dialog.tsx**: Modal/dialog component
- **form.tsx**: Form components with validation
- **input.tsx**: Text input field
- **label.tsx**: Form label
- **select.tsx**: Dropdown select component
- **textarea.tsx**: Multi-line text input
- **table.tsx**: Data table component
- **tabs.tsx**: Tab navigation
- **progress.tsx**: Progress bar
- **avatar.tsx**: User avatar
- **badge.tsx**: Status badge
- **dropdown-menu.tsx**: Dropdown menu
- **radio-group.tsx**: Radio button group
- **scroll-area.tsx**: Custom scrollable area
- **separator.tsx**: Visual separator
- **switch.tsx**: Toggle switch

### Feature Components

#### Dashboard Components
- Course cards with progress indicators
- Activity summary
- Upcoming deadlines
- Recent notifications

#### Course Components
- Course list with filters
- Course detail view
- Enrollment form
- Week accordion
- Activity cards

#### Assignment Components
- Assignment list
- Assignment submission form
- File upload component
- Grading interface

#### Exam Components
- Exam list
- Exam taking interface with timer
- Question display (MCQ, Essay, etc.)
- Auto-save functionality
- Anti-cheat detection

#### Forum Components
- Thread list
- Thread detail
- Reply form
- Mention system
- Attachment upload

#### Calendar Components
- Calendar view (month/week/day)
- Event creation dialog
- Event detail modal
- Event categories

#### Notification Components
- Notification list
- Notification bell
- Mark as read functionality

#### Profile Components
- Profile editing
- Avatar upload
- Password change
- Storage quota display

---

## Fitur yang Sudah Implementasi

### ✅ Fase 1 - Fondasi (Completed)

#### Infrastructure
- [x] Docker Compose setup (PostgreSQL, Redis, MinIO)
- [x] Database schema lengkap dengan Prisma
- [x] Seed data untuk demo

#### Backend
- [x] NestJS framework dengan modular architecture
- [x] Authentication dengan JWT
- [x] Role-based access control (RBAC)
- [x] Swagger API documentation
- [x] Global validation pipe dengan class-validator
- [x] Response interceptor untuk format konsisten
- [x] Exception filter untuk error handling
- [x] Rate limiting dengan @nestjs/throttler
- [x] BullMQ integration untuk job queue
- [x] MinIO integration untuk file storage
- [x] Prisma ORM dengan PostgreSQL

#### Frontend
- [x] Next.js 16 dengan App Router
- [x] TypeScript configuration
- [x] Tailwind CSS setup
- [x] shadcn/ui component library
- [x] NextAuth.js integration
- [x] Middleware untuk route protection
- [x] Design system dengan color tokens
- [x] Error pages (403, 404, 500)
- [x] Global layout dengan navigation

#### Authentication
- [x] Login page
- [x] Register page
- [x] Forgot password page
- [x] Session management
- [x] Role-based redirects

#### Dashboard
- [x] Admin dashboard
- [x] Dosen dashboard
- [x] Mahasiswa dashboard
- [x] Course cards per role
- [x] Activity summary

#### Database Models
- [x] User dengan roles
- [x] Course dengan categories
- [x] Enrollment system
- [x] Module dan ModuleFile
- [x] Assignment dan AssignmentSubmission
- [x] Exam, Question, QuestionOption
- [x] ExamAttempt dan Answer
- [x] CalendarEvent
- [x] PrivateFile
- [x] ForumThread, ForumReply, ForumAttachment, ForumMention
- [x] Notification
- [x] ActivityLog
- [x] CourseSettings
- [x] Grade dan GradeHistory
- [x] Announcement dan AnnouncementRead
- [x] QuestionBank
- [x] Week dan Activity

### ⚠️ Fase 2 - Course Management (Partial)

#### Backend
- [x] Course CRUD endpoints
- [x] Course category management
- [x] Enrollment system with code
- [x] Module management
- [x] Week management
- [x] Activity management

#### Frontend
- [x] Course list view
- [x] Course detail view
- [x] Enrollment form
- [x] Week accordion
- [x] Activity cards
- [x] Activity edit functionality
- [x] Activity delete functionality
- [x] Activity duplicate functionality
- [x] Activity publish/unpublish
- [x] Week creation dialog

### ⚠️ Fase 3 - Tugas & Penilaian (Partial)

#### Backend
- [x] Assignment CRUD endpoints
- [x] Assignment submission endpoints
- [x] Grading endpoints
- [x] File upload via MinIO presigned URL

#### Frontend
- [x] Assignment list view
- [x] Assignment submission form
- [ ] Grading interface (partial)
- [ ] Rubric system (TODO)

### ⚠️ Fase 4 - Ujian (Partial)

#### Backend
- [x] Exam CRUD endpoints
- [x] Question management
- [x] Exam attempt tracking
- [x] Answer submission
- [x] Anti-cheat logging
- [x] Question bank system

#### Frontend
- [x] Exam list view
- [x] Exam taking interface
- [x] Timer countdown
- [x] Auto-save functionality
- [ ] Question ordering API (TODO)
- [ ] Results display (partial)

### ⚠️ Fase 5 - Fitur Pendukung (Partial)

#### Backend
- [x] Calendar event endpoints
- [x] Notification endpoints
- [x] Gradebook endpoints
- [x] Private file storage endpoints
- [x] Forum endpoints
- [x] Announcement endpoints

#### Frontend
- [x] Calendar view
- [x] Notification bell
- [x] Gradebook view
- [x] Private file storage
- [x] Forum interface
- [x] Announcement display
- [ ] BullMQ job processing (TODO)
- [ ] CSV export (TODO)

---

## Fitur yang Perlu Ditambahkan

### 🔴 High Priority

#### 1. Testing Suite
- **Unit Tests**: Jest untuk backend services dan utilities
- **Integration Tests**: Supertest untuk API endpoints
- **E2E Tests**: Playwright atau Cypress untuk user flows
- **Component Tests**: React Testing Library untuk UI components

#### 2. Security Enhancements
- **CORS Configuration**: Review dan tighten CORS settings
- **Input Validation**: Comprehensive validation di semua DTOs
- **SQL Injection Prevention**: Review raw queries jika ada
- **XSS Protection**: Sanitize user input di forum dan comments
- **CSRF Protection**: Implement CSRF tokens untuk state-changing operations
- **Rate Limiting**: Per-role rate limiting (stricter untuk students)
- **Password Policy**: Enforce strong password requirements
- **2FA**: Two-factor authentication untuk sensitive operations

#### 3. Error Handling & Logging
- **Structured Logging**: Winston atau Pino untuk backend logging
- **Error Tracking**: Sentry integration untuk production error monitoring
- **Request Logging**: Log semua API requests dengan metadata
- **Audit Logs**: Comprehensive activity logging untuk compliance

#### 4. Performance Optimization
- **Database Indexing**: Add indexes untuk frequently queried fields
- **Query Optimization**: Fix N+1 query problems dengan Prisma includes
- **Caching Layer**: Implement Redis caching untuk frequently accessed data
- **Frontend Optimization**:
  - Code splitting dengan dynamic imports
  - Image optimization dengan next/image
  - Lazy loading untuk components
  - Bundle size analysis
- **CDN Integration**: Serve static assets via CDN

#### 5. Missing Frontend Features
- **Activity Management**: Implement edit, delete, duplicate, move activities
- **Activity Publishing**: Implement publish/unpublish functionality
- **Week Creation**: Implement week creation dialog
- **Exam Question Ordering**: Implement drag-and-drop question ordering
- **File Upload Progress**: Show upload progress indicator
- **Real-time Updates**: WebSocket untuk live notifications
- **Offline Support**: Service worker untuk offline capability

### 🟡 Medium Priority

#### 6. Documentation
- **API Documentation**: Complete Swagger documentation dengan examples
- **Component Documentation**: Storybook untuk UI components
- **Architecture Documentation**: System architecture diagrams
- **Deployment Guide**: Step-by-step deployment instructions
- **Contributing Guide**: Guidelines untuk developers
- **User Manual**: User guide untuk end-users

#### 7. CI/CD Pipeline
- **GitHub Actions**: Automated testing, linting, dan build
- **Docker Multi-stage Builds**: Optimized production Docker images
- **Environment Management**: Better environment variable validation
- **Automated Deployments**: Staging dan production deployment pipelines
- **Database Migrations**: Automated migration in CI/CD

#### 8. Code Quality Tools
- **ESLint Strict Mode**: Enable stricter linting rules
- **TypeScript Strict Mode**: Enable strict type checking
- **Prettier Configuration**: Consistent code formatting
- **Husky Git Hooks**: Pre-commit checks untuk linting dan testing
- **Lint-staged**: Run linters hanya pada staged files
- **Commitlint**: Conventional commit message enforcement

#### 9. Monitoring & Observability
- **Health Check Endpoints**: `/health`, `/health/db`, `/health/redis`
- **Metrics Collection**: Prometheus metrics export
- **Performance Monitoring**: APM tool (New Relic, Datadog)
- **Uptime Monitoring**: External uptime monitoring
- **Database Monitoring**: Query performance tracking

#### 10. Accessibility
- **WCAG Compliance**: Audit dan fix accessibility issues
- **Keyboard Navigation**: Full keyboard-only navigation support
- **Screen Reader Support**: Proper ARIA labels dan roles
- **Color Contrast**: Ensure WCAG AA color contrast ratios
- **Focus Indicators**: Clear focus indicators for interactive elements
- **Alt Text**: Proper alt text untuk images

### 🟢 Low Priority

#### 11. Backup & Disaster Recovery
- **Database Backups**: Automated daily backups dengan retention policy
- **MinIO Backups**: Backup file storage ke secondary location
- **Backup Testing**: Regular backup restoration testing
- **Disaster Recovery Plan**: Documented DR procedure
- **Failover Mechanism**: Database failover configuration

#### 12. Advanced Features
- **Analytics Dashboard**: Learning analytics dan insights
- **Gamification**: Points, badges, leaderboards
- **Mobile App**: React Native atau PWA
- **Video Conferencing**: Integration dengan Zoom/Google Meet
- **Plagiarism Detection**: Integration dengan plagiarism checker
- **AI-powered Features**: AI grading, recommendations
- **Bulk Operations**: Bulk enrollment, bulk grading
- **Advanced Search**: Full-text search dengan Elasticsearch
- **Email Notifications**: SMTP integration untuk email alerts
- **SMS Notifications**: SMS gateway integration
- **Calendar Integration**: Google Calendar, Outlook sync
- **LTI Integration**: Learning Tools Interoperability untuk external tools

#### 13. Internationalization
- **i18n Support**: Multi-language support (English, Indonesian)
- **Date/Time Localization**: Locale-aware date/time formatting
- **Currency Localization**: Jika ada fitur pembayaran
- **RTL Support**: Right-to-left language support

#### 14. Theming
- **Dark Mode**: Dark theme support
- **Custom Themes**: Allow custom color schemes
- **Theme Persistence**: Save theme preference

---

## Known Issues & Bugs

### Frontend Issues

#### 1. Activity Management (week-accordion.tsx)
- **Location**: `frontend/src/components/course-detail/week-accordion.tsx`
- **Issues**:
  - Edit activity functionality not implemented (line 236, 256)
  - Delete activity functionality not implemented (line 237, 257)
  - Duplicate activity functionality not implemented (line 238, 258)
  - Move activity functionality not implemented (line 239, 259)
- **Impact**: Users cannot manage activities after creation
- **Priority**: High

#### 2. Activity Publishing (activity-card.tsx)
- **Location**: `frontend/src/components/course-detail/activity-card.tsx`
- **Issues**:
  - Publish activity functionality not implemented (line 241)
  - Unpublish activity functionality not implemented (line 248)
- **Impact**: Activities cannot be published/unpublished
- **Priority**: High

#### 3. Week Creation (course-detail-client.tsx)
- **Location**: `frontend/src/app/[role]/courses/[courseId]/course-detail-client.tsx`
- **Issues**:
  - Create week dialog not implemented (line 148)
- **Impact**: New weeks cannot be created
- **Priority**: High

#### 4. Exam Question Ordering (exam-questions-client.tsx)
- **Location**: `frontend/src/components/exams/exam-questions-client.tsx`
- **Issues**:
  - API call to update question order not implemented (line 192)
- **Impact**: Questions cannot be reordered
- **Priority**: Medium

### Backend Issues

#### 1. Missing Indexes
- **Issue**: Database schema lacks proper indexes for frequently queried fields
- **Affected Tables**: users, courses, enrollments, exam_attempts, grades
- **Impact**: Slow queries as data grows
- **Priority**: Medium

#### 2. N+1 Query Problems
- **Issue**: Some endpoints may have N+1 query issues
- **Affected Endpoints**: Course listing with relations, Gradebook
- **Impact**: Performance degradation
- **Priority**: Medium

### Configuration Issues

#### 1. Environment Variables
- **Issue**: No validation for required environment variables
- **Impact**: Runtime errors if env vars missing
- **Priority**: Medium

#### 2. CORS Configuration
- **Issue**: CORS allows all origins from FRONTEND_URL without validation
- **Impact**: Potential security risk
- **Priority**: Medium

---

## Rekomendasi Perbaikan

### Immediate Actions (1-2 weeks)

#### 1. Implement Missing Frontend Features
```typescript
// Priority: High
// File: week-accordion.tsx
- Implement editActivity() function
- Implement deleteActivity() function with confirmation
- Implement duplicateActivity() function
- Implement moveActivity() function with drag-and-drop

// File: activity-card.tsx
- Implement publishActivity() API call
- Implement unpublishActivity() API call

// File: course-detail-client.tsx
- Implement create week dialog with form validation
```

#### 2. Add Database Indexes
```prisma
// File: prisma/schema.prisma
model User {
  // Add indexes
  @@index([email])
  @@index([role])
}

model Course {
  // Add indexes
  @@index([instructorId])
  @@index([categoryId])
  @@index([isActive])
}

model Enrollment {
  // Add indexes
  @@index([userId])
  @@index([courseId])
}

model ExamAttempt {
  // Add indexes
  @@index([examId])
  @@index([studentId])
  @@index([status])
}
```

#### 3. Add Environment Variable Validation
```typescript
// File: backend/src/config/validation.ts
import * as Joi from 'joi';

export const envSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  MINIO_ENDPOINT: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  // ... add all required env vars
}).unknown();

// Validate on startup
```

### Short-term Actions (1 month)

#### 4. Implement Testing Suite
```bash
# Install testing dependencies
cd backend
npm install --save-dev @types/jest jest ts-jest @nestjs/testing
npm install --save-dev supertest @types/supertest

cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev playwright @playwright/test
```

#### 5. Add Structured Logging
```bash
cd backend
npm install winston nest-winston
npm install --save-dev @types/winston
```

```typescript
// File: backend/src/common/logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

#### 6. Implement Caching Layer
```typescript
// File: backend/src/common/cache/cache.service.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    });
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

#### 7. Add Health Check Endpoints
```typescript
// File: backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }
}
```

### Medium-term Actions (2-3 months)

#### 8. Setup CI/CD Pipeline
```yaml
# File: .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      - name: Run linter
        run: |
          cd backend
          npm run lint
      - name: Run tests
        run: |
          cd backend
          npm run test
      - name: Build
        run: |
          cd backend
          npm run build

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Run linter
        run: |
          cd frontend
          npm run lint
      - name: Run tests
        run: |
          cd frontend
          npm run test
      - name: Build
        run: |
          cd frontend
          npm run build
```

#### 9. Implement Error Tracking
```bash
cd backend
npm install @sentry/node
```

```typescript
// File: backend/src/common/sentry/sentry.service.ts
import * as Sentry from '@sentry/node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}
```

#### 10. Add Code Quality Tools
```bash
# Install Husky and lint-staged
npm install --save-dev husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

```json
// File: package.json
{
  "lint-staged": {
    "backend/src/**/*.ts": [
      "eslint --fix",
      "prettier --write"
    ],
    "frontend/src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### Long-term Actions (3-6 months)

#### 11. Implement Real-time Features
```bash
cd backend
npm install @nestjs/websockets @nestjs/platform-socket.io
cd frontend
npm install socket.io-client
```

#### 12. Add Monitoring & Metrics
```bash
cd backend
npm install @nestjs/terminus prom-client
```

#### 13. Implement Advanced Security
- Add rate limiting per user
- Implement API key authentication for external integrations
- Add request signing for sensitive operations
- Implement IP whitelisting for admin operations

#### 14. Performance Optimization
- Implement database connection pooling
- Add Redis cluster for high availability
- Implement CDN for static assets
- Add database read replicas

---

## Best Practices

### Backend Best Practices

#### 1. Error Handling
```typescript
// Use custom exceptions
throw new BadRequestException('Invalid input');
throw new UnauthorizedException('Not authenticated');
throw new ForbiddenException('Access denied');
throw new NotFoundException('Resource not found');
throw new ConflictException('Resource already exists');
```

#### 2. Validation
```typescript
// Use DTOs with class-validator
export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]+$/, { message: 'Code must be uppercase alphanumeric' })
  code: string;
}
```

#### 3. Service Layer
```typescript
// Keep business logic in services
// Controllers should only handle HTTP concerns
@Injectable()
export class CoursesService {
  async createCourse(dto: CreateCourseDto, instructorId: string) {
    // Business logic here
    const course = await this.prisma.course.create({
      data: {
        ...dto,
        instructorId,
      },
    });
    return course;
  }
}
```

#### 4. Database Transactions
```typescript
// Use transactions for multi-step operations
async enrollStudent(courseId: string, studentId: string) {
  return this.prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.create({
      data: { courseId, studentId },
    });
    await tx.notification.create({
      data: {
        userId: studentId,
        type: 'COURSE_CREATED',
        title: 'New Enrollment',
        message: 'You have been enrolled in a new course',
      },
    });
    return enrollment;
  });
}
```

#### 5. Pagination
```typescript
// Implement pagination for list endpoints
async getCourses(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [courses, total] = await Promise.all([
    this.prisma.course.findMany({
      skip,
      take: limit,
      include: { instructor: true },
    }),
    this.prisma.course.count(),
  ]);
  return {
    data: courses,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### Frontend Best Practices

#### 1. Component Organization
```typescript
// Keep components small and focused
// Use composition over inheritance
// Separate presentational and container components
```

#### 2. State Management
```typescript
// Use React hooks for local state
// Use NextAuth for auth state
// Use server components when possible
// Use client components only for interactivity
```

#### 3. Error Handling
```typescript
// Use error boundaries
// Show user-friendly error messages
// Log errors for debugging
'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

#### 4. Loading States
```typescript
// Show loading indicators
// Use skeleton screens
// Implement optimistic updates
'use client';

export default function CourseList() {
  const { data, isLoading, error } = useCourses();

  if (isLoading) return <CourseListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  return <CourseListData courses={data} />;
}
```

#### 5. Type Safety
```typescript
// Use TypeScript for all components
// Define proper interfaces for props
// Avoid 'any' type
interface CourseCardProps {
  course: Course;
  onEnroll: (courseId: string) => void;
}

export default function CourseCard({ course, onEnroll }: CourseCardProps) {
  // Component implementation
}
```

### Database Best Practices

#### 1. Schema Design
```prisma
// Use proper relationships
// Add indexes for frequently queried fields
// Use enums for fixed values
// Add constraints for data integrity
```

#### 2. Query Optimization
```typescript
// Use select to limit returned fields
// Use include for relations (avoid N+1)
// Use where for filtering
// Use orderBy for sorting
const courses = await prisma.course.findMany({
  select: {
    id: true,
    name: true,
    code: true,
    instructor: {
      select: {
        id: true,
        name: true,
      },
    },
  },
  where: { isActive: true },
  orderBy: { createdAt: 'desc' },
});
```

#### 3. Migrations
```bash
# Always review migrations before applying
npx prisma migrate dev --create-only
# Review the generated migration
npx prisma migrate dev
```

### Security Best Practices

#### 1. Authentication
```typescript
// Always validate JWT tokens
// Use secure cookie settings
// Implement token refresh
// Logout should invalidate tokens
```

#### 2. Authorization
```typescript
// Use guards for route protection
// Check permissions at service level
// Use role-based access control
// Implement resource-level permissions
```

#### 3. Data Validation
```typescript
// Validate all input on both frontend and backend
// Sanitize user input
// Use parameterized queries (Prisma handles this)
// Implement rate limiting
```

#### 4. Secrets Management
```bash
# Never commit secrets to git
# Use environment variables
# Use secret management services in production
# Rotate secrets regularly
```

---

## Deployment Guide

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ installed
- Domain name configured (for production)
- SSL certificate (for production)

### Development Deployment

#### 1. Clone Repository
```bash
git clone <repository-url>
cd e-course
```

#### 2. Setup Environment
```bash
cp .env.example .env
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

Edit `.env` files with appropriate values:
```env
DATABASE_URL="postgresql://ecourse:ecourse_secret@localhost:5433/ecourse_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
NEXTAUTH_SECRET=your-super-secret-nextauth-key-min-32-chars
```

#### 3. Start Infrastructure
```bash
docker compose up -d
```

#### 4. Setup Backend
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run start:dev
```

#### 5. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### Production Deployment

#### Option 1: Docker Compose (Simple)

1. **Update Environment Variables**
```bash
# Use production-ready values
DATABASE_URL="postgresql://user:password@production-db:5432/ecourse_db"
JWT_SECRET=<strong-random-secret>
NEXTAUTH_SECRET=<strong-random-secret>
```

2. **Build Docker Images**
```bash
docker compose -f docker-compose.prod.yml build
```

3. **Deploy**
```bash
docker compose -f docker-compose.prod.yml up -d
```

#### Option 2: Kubernetes (Scalable)

1. **Create Kubernetes Manifests**
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecourse-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ecourse-backend
  template:
    metadata:
      labels:
        app: ecourse-backend
    spec:
      containers:
      - name: backend
        image: ecourse-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ecourse-secrets
              key: database-url
```

2. **Deploy to Cluster**
```bash
kubectl apply -f k8s/
```

#### Option 3: Cloud Services (Managed)

**AWS Deployment:**
- RDS for PostgreSQL
- ElastiCache for Redis
- S3 for object storage (instead of MinIO)
- ECS or EKS for container orchestration
- CloudFront for CDN
- Route 53 for DNS

**Google Cloud Deployment:**
- Cloud SQL for PostgreSQL
- Memorystore for Redis
- Cloud Storage for object storage
- Cloud Run or GKE for containers
- Cloud CDN
- Cloud DNS

### Monitoring in Production

#### 1. Health Checks
```bash
# Check backend health
curl https://api.yourdomain.com/health

# Check database connection
curl https://api.yourdomain.com/health/db
```

#### 2. Log Aggregation
- Use CloudWatch (AWS) or Stackdriver (GCP)
- Or use ELK Stack (Elasticsearch, Logstash, Kibana)
- Or use Sentry for centralized error tracking

#### 3. Metrics Collection
- Use Prometheus for metrics
- Use Grafana for visualization
- Monitor: CPU, memory, disk, network, request rates, error rates

### Backup Strategy

#### Database Backups
```bash
# Daily backups
pg_dump -U ecourse ecourse_db > backup_$(date +%Y%m%d).sql

# Automated with cron
0 2 * * * pg_dump -U ecourse ecourse_db > /backups/daily/backup_$(date +\%Y\%m\%d).sql
```

#### MinIO Backups
```bash
# Use mc CLI to sync to backup location
mc mirror /data/ecourse-public /backup-location/ecourse-public
```

### Scaling Strategy

#### Horizontal Scaling
- Deploy multiple backend instances
- Use load balancer (nginx, AWS ALB)
- Use Redis for session sharing
- Use database read replicas

#### Vertical Scaling
- Increase instance size
- Optimize database queries
- Add caching layer
- Use CDN for static assets

---

## Summary

### Project Status
- **Fase 1 (Fondasi)**: ✅ Completed
- **Fase 2 (Course Management)**: ⚠️ Partial (frontend incomplete)
- **Fase 3 (Tugas & Penilaian)**: ⚠️ Partial (grading incomplete)
- **Fase 4 (Ujian)**: ⚠️ Partial (question ordering missing)
- **Fase 5 (Fitur Pendukung)**: ⚠️ Partial (BullMQ jobs, CSV export missing)

### Critical Issues
1. **High**: Missing frontend activity management features
2. **High**: No testing suite
3. **Medium**: Missing database indexes
4. **Medium**: No structured logging
5. **Medium**: No error tracking

### Recommended Next Steps
1. Implement missing frontend features (2 weeks)
2. Add database indexes (1 week)
3. Implement testing suite (1 month)
4. Add structured logging (2 weeks)
5. Setup CI/CD pipeline (2 weeks)
6. Add monitoring and error tracking (1 month)

### Long-term Goals
- Complete all feature phases
- Achieve 90%+ test coverage
- Implement advanced security features
- Optimize for production scale
- Add mobile support (PWA or native app)

---

## Contact & Support

For questions or issues related to this project, please contact the development team or refer to the internal documentation.

---

**Last Updated**: August 2026
**Version**: 1.0.0
**Status**: Active Development