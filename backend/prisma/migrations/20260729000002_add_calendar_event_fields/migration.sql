-- Add missing calendar event fields
ALTER TABLE "calendar_events" ADD COLUMN "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "calendar_events" ADD COLUMN "endDate" TIMESTAMP(3);
ALTER TABLE "calendar_events" ADD COLUMN "startTime" TEXT;
ALTER TABLE "calendar_events" ADD COLUMN "endTime" TEXT;
ALTER TABLE "calendar_events" ADD COLUMN "location" TEXT;
ALTER TABLE "calendar_events" ADD COLUMN "isOnline" BOOLEAN DEFAULT false;
ALTER TABLE "calendar_events" ADD COLUMN "meetingLink" TEXT;
ALTER TABLE "calendar_events" ADD COLUMN "category" TEXT DEFAULT 'PENGUMUMAN_AKADEMIK';
ALTER TABLE "calendar_events" ADD COLUMN "color" TEXT DEFAULT '#1a365d';
ALTER TABLE "calendar_events" ADD COLUMN "targetAudience" TEXT DEFAULT 'COURSE_STUDENTS';
ALTER TABLE "calendar_events" ADD COLUMN "relatedActivityType" TEXT DEFAULT 'NONE';
ALTER TABLE "calendar_events" ADD COLUMN "relatedActivityId" TEXT;
ALTER TABLE "calendar_events" ADD COLUMN "isPublished" BOOLEAN DEFAULT true;
ALTER TABLE "calendar_events" ADD COLUMN "attachments" JSONB;
ALTER TABLE "calendar_events" ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to set startDate from date
UPDATE "calendar_events" SET "startDate" = "date" WHERE "date" IS NOT NULL;

-- Drop old date column
ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "date";
