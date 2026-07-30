import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Applying announcement migration...');

    // Add ANNOUNCEMENT_CREATED to NotificationType enum
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ANNOUNCEMENT_CREATED';
    `);

    // Create announcements table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "announcements" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "attachments" JSONB,
        "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "validUntil" TIMESTAMP(3),
        "isPublished" BOOLEAN NOT NULL DEFAULT true,
        "priority" TEXT NOT NULL DEFAULT 'normal',
        "courseId" TEXT,
        "authorId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create announcement_reads table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "announcement_reads" (
        "id" TEXT NOT NULL,
        "announcementId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create unique index
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "announcement_reads_announcementId_userId_key" 
      ON "announcement_reads"("announcementId", "userId");
    `);

    // Add foreign keys
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "announcements" 
      ADD CONSTRAINT IF NOT EXISTS "announcements_authorId_fkey" 
      FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "announcements" 
      ADD CONSTRAINT IF NOT EXISTS "announcements_courseId_fkey" 
      FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "announcement_reads" 
      ADD CONSTRAINT IF NOT EXISTS "announcement_reads_announcementId_fkey" 
      FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "announcement_reads" 
      ADD CONSTRAINT IF NOT EXISTS "announcement_reads_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    console.log('Migration applied successfully');
  } catch (error) {
    console.error('Error applying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
