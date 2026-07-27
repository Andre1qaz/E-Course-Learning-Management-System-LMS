import 'dotenv/config';
console.log('DATABASE_URL:', process.env.DATABASE_URL);
import {
  PrismaClient,
  Role,
  QuestionType,
  ModuleFileType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const SALT_ROUNDS = 12;
const defaultPassword = 'Password123!';

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecourse.ac.id' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@ecourse.ac.id',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const dosen1 = await prisma.user.upsert({
    where: { email: 'dosen1@ecourse.ac.id' },
    update: {},
    create: {
      name: 'Dr. Ahmad Wijaya',
      email: 'dosen1@ecourse.ac.id',
      password: hashedPassword,
      role: Role.DOSEN,
    },
  });

  const dosen2 = await prisma.user.upsert({
    where: { email: 'dosen2@ecourse.ac.id' },
    update: {},
    create: {
      name: 'Prof. Siti Rahayu',
      email: 'dosen2@ecourse.ac.id',
      password: hashedPassword,
      role: Role.DOSEN,
    },
  });

  const students = await Promise.all(
    [
      'Budi Santoso',
      'Citra Dewi',
      'Dedi Pratama',
      'Eka Putri',
      'Fajar Nugroho',
    ].map((name, i) =>
      prisma.user.upsert({
        where: { email: `mahasiswa${i + 1}@ecourse.ac.id` },
        update: {},
        create: {
          name,
          email: `mahasiswa${i + 1}@ecourse.ac.id`,
          password: hashedPassword,
          role: Role.MAHASISWA,
        },
      }),
    ),
  );

  const cat2024 = await prisma.courseCategory.upsert({
    where: { name: '2024/2025' },
    update: {},
    create: { name: '2024/2025', academicYear: '2024/2025' },
  });

  const cat2025 = await prisma.courseCategory.upsert({
    where: { name: '2025/2026' },
    update: {},
    create: { name: '2025/2026', academicYear: '2025/2026', isActive: true },
  });

  const course1 = await prisma.course.upsert({
    where: { code: 'IF101' },
    update: {},
    create: {
      name: 'Pemrograman Web',
      code: 'IF101',
      description: 'Mempelajari dasar-dasar pengembangan aplikasi web modern.',
      learningObjectives:
        '1. Memahami HTML, CSS, JavaScript\n2. Membangun aplikasi full-stack\n3. Menerapkan prinsip UX/UI',
      thumbnailColor: '#1a365d',
      instructorId: dosen1.id,
      categoryId: cat2025.id,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { code: 'IF102' },
    update: {},
    create: {
      name: 'Basis Data',
      code: 'IF102',
      description: 'Konsep dan implementasi sistem basis data relasional.',
      learningObjectives:
        '1. Memahami model relasional\n2. Menulis query SQL\n3. Merancang skema database',
      thumbnailColor: '#2d6a4f',
      instructorId: dosen2.id,
      categoryId: cat2025.id,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { code: 'IF103' },
    update: {},
    create: {
      name: 'Algoritma & Struktur Data',
      code: 'IF103',
      description: 'Fundamental algoritma dan struktur data untuk pemrograman.',
      learningObjectives:
        '1. Menganalisis kompleksitas algoritma\n2. Implementasi struktur data\n3. Menyelesaikan masalah komputasi',
      thumbnailColor: '#e07a5f',
      instructorId: dosen1.id,
      categoryId: cat2024.id,
    },
  });

  for (const student of students) {
    for (const course of [course1, course2, course3]) {
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: { userId: student.id, courseId: course.id },
        },
        update: {},
        create: { userId: student.id, courseId: course.id },
      });
    }
  }

  const module1 = await prisma.module.create({
    data: {
      courseId: course1.id,
      title: 'Pengenalan Web Development',
      description: 'Overview teknologi web modern dan setup environment.',
      learningObjectives:
        'Memahami arsitektur client-server dan tools development.',
      order: 1,
    },
  });

  await prisma.moduleFile.create({
    data: {
      moduleId: module1.id,
      fileName: 'modul-1-pengenalan.pdf',
      fileUrl: 'https://example.com/modul-1.pdf',
      fileType: ModuleFileType.PDF,
      fileSize: BigInt(1024000),
    },
  });

  await prisma.module.create({
    data: {
      courseId: course1.id,
      title: 'HTML & CSS Fundamentals',
      description: 'Struktur halaman web dan styling responsif.',
      learningObjectives:
        'Mampu membuat layout responsif dengan HTML5 dan CSS3.',
      order: 2,
    },
  });

  const assignment1 = await prisma.assignment.create({
    data: {
      courseId: course1.id,
      title: 'Tugas 1: Landing Page',
      description: 'Buat landing page responsif menggunakan HTML dan CSS.',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxScore: 100,
    },
  });

  for (const student of students.slice(0, 3)) {
    await prisma.assignmentSubmission.create({
      data: {
        assignmentId: assignment1.id,
        studentId: student.id,
        fileUrl: 'https://example.com/tugas.pdf',
        fileName: 'tugas-landing-page.pdf',
        submittedAt: new Date(),
        status: 'SUBMITTED',
      },
    });
  }

  const exam1 = await prisma.exam.create({
    data: {
      courseId: course1.id,
      title: 'Ujian Tengah Semester',
      description: 'Ujian covering modul 1-2',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      duration: 90,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isPublished: true,
    },
  });

  await prisma.question.create({
    data: {
      examId: exam1.id,
      type: QuestionType.ESSAY,
      questionText:
        'Jelaskan perbedaan antara HTML, CSS, dan JavaScript beserta peran masing-masing.',
      points: 30,
      order: 2,
    },
  });

  await prisma.question.create({
    data: {
      examId: exam1.id,
      type: QuestionType.SHORT_ANSWER,
      questionText:
        'Properti CSS apa yang digunakan untuk membuat layout flexbox?',
      points: 10,
      order: 3,
    },
  });

  await prisma.calendarEvent.create({
    data: {
      title: 'Deadline Tugas 1',
      description: assignment1.description,
      date: assignment1.deadline,
      type: 'DEADLINE',
      courseId: course1.id,
    },
  });

  await prisma.forumThread.create({
    data: {
      courseId: course1.id,
      authorId: dosen1.id,
      title: 'Selamat datang di Forum Pemrograman Web',
      content:
        'Gunakan forum ini untuk diskusi materi, tugas, dan pertanyaan terkait course.',
      isPinned: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: students[0].id,
      type: 'DEADLINE_REMINDER',
      title: 'Deadline Tugas Mendekat',
      message: 'Tugas 1: Landing Page akan berakhir dalam 24 jam.',
      link: `/courses/${course1.id}`,
    },
  });

  console.log('✅ Seed completed!');
  console.log('\n📋 Akun demo (password: Password123!):');
  console.log(`   Admin:     ${admin.email}`);
  console.log(`   Dosen 1:   ${dosen1.email}`);
  console.log(`   Dosen 2:   ${dosen2.email}`);
  console.log(
    `   Mahasiswa: mahasiswa1@ecourse.ac.id - mahasiswa5@ecourse.ac.id`,
  );
  console.log(
    `\n📚 Course enrollment codes (check database for auto-generated codes):`,
  );
  console.log(`   ${course1.name}: ${course1.enrollmentCode}`);
  console.log(`   ${course2.name}: ${course2.enrollmentCode}`);
  console.log(`   ${course3.name}: ${course3.enrollmentCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
