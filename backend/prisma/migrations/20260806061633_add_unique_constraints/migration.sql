/*
  Warnings:

  - You are about to drop the column `date` on the `calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `autoGrade` on the `questions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[examId,studentId,attemptNumber]` on the table `exam_attempts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bestReplyId]` on the table `forum_threads` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `startDate` to the `calendar_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `calendar_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `exam_attempts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExamCategory" AS ENUM ('QUIZ', 'UTS', 'UAS', 'GENERAL');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "GradingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('PERKULIAHAN', 'MATERI_BARU', 'ASSIGNMENT', 'QUIZ', 'UTS', 'UAS', 'SEMINAR', 'PROJECT', 'MEETING', 'DEADLINE', 'PENGUMUMAN_AKADEMIK');

-- CreateEnum
CREATE TYPE "EventTargetAudience" AS ENUM ('ALL_STUDENTS', 'COURSE_STUDENTS');

-- CreateEnum
CREATE TYPE "RelatedActivityType" AS ENUM ('ASSIGNMENT', 'EXAM', 'MODULE', 'ACTIVITY', 'NONE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'COURSE_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'MATERIAL_PUBLISHED';
ALTER TYPE "NotificationType" ADD VALUE 'ASSIGNMENT_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'QUIZ_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'EXAM_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'SCHEDULE_CHANGED';

-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'TRUE_FALSE';

-- DropIndex
DROP INDEX "exam_attempts_examId_studentId_key";

-- AlterTable
ALTER TABLE "calendar_events" DROP COLUMN "date",
ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "category" "EventCategory" NOT NULL DEFAULT 'PENGUMUMAN_AKADEMIK',
ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#1a365d',
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "meetingLink" TEXT,
ADD COLUMN     "relatedActivityId" TEXT,
ADD COLUMN     "relatedActivityType" "RelatedActivityType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startTime" TEXT,
ADD COLUMN     "targetAudience" "EventTargetAudience" NOT NULL DEFAULT 'COURSE_STUDENTS',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'ANNOUNCEMENT';

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "enrollmentEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "exam_attempts" ADD COLUMN     "attemptNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "autoSavedData" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gradingStatus" "GradingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "passed" BOOLEAN,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "allowBack" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoSubmit" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "category" "ExamCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "passingGrade" DOUBLE PRECISION NOT NULL DEFAULT 60,
ADD COLUMN     "showExplanation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showResults" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weekId" TEXT;

-- AlterTable
ALTER TABLE "forum_threads" ADD COLUMN     "bestReplyId" TEXT,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedBy" TEXT;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "autoGrade",
ADD COLUMN     "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "isFromBank" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxChars" INTEGER,
ADD COLUMN     "questionBankId" TEXT,
ADD COLUMN     "rubric" TEXT,
ADD COLUMN     "tolerance" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "examId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "rubric_assessments" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "rubricCriterionId" TEXT NOT NULL,
    "rubricCriterionLevelId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubric_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubrics" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalPoints" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubric_criteria" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxPoints" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubric_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubric_criterion_levels" (
    "id" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubric_criterion_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_banks" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "topic" TEXT,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "questionType" "QuestionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_tags" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_attachments" (
    "id" TEXT NOT NULL,
    "threadId" TEXT,
    "replyId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_mentions" (
    "id" TEXT NOT NULL,
    "threadId" TEXT,
    "replyId" TEXT,
    "mentionedUserId" TEXT NOT NULL,
    "mentionedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_settings" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "passingGrade" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "assignmentWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "quizWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "utsWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "uasWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "otherWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assignmentScore" DOUBLE PRECISION DEFAULT 0,
    "quizScore" DOUBLE PRECISION DEFAULT 0,
    "utsScore" DOUBLE PRECISION DEFAULT 0,
    "uasScore" DOUBLE PRECISION DEFAULT 0,
    "otherScore" DOUBLE PRECISION DEFAULT 0,
    "finalScore" DOUBLE PRECISION DEFAULT 0,
    "passed" BOOLEAN,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_histories" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" DOUBLE PRECISION,
    "newValue" DOUBLE PRECISION,
    "changeReason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rubric_assessments_submissionId_rubricCriterionId_key" ON "rubric_assessments"("submissionId", "rubricCriterionId");

-- CreateIndex
CREATE UNIQUE INDEX "rubrics_assignmentId_key" ON "rubrics"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "question_tags_questionId_tag_key" ON "question_tags"("questionId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "course_settings_courseId_key" ON "course_settings"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "grades_courseId_studentId_key" ON "grades"("courseId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempts_examId_studentId_attemptNumber_key" ON "exam_attempts"("examId", "studentId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "forum_threads_bestReplyId_key" ON "forum_threads"("bestReplyId");

-- AddForeignKey
ALTER TABLE "rubric_assessments" ADD CONSTRAINT "rubric_assessments_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubric_assessments" ADD CONSTRAINT "rubric_assessments_rubricCriterionId_fkey" FOREIGN KEY ("rubricCriterionId") REFERENCES "rubric_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubric_assessments" ADD CONSTRAINT "rubric_assessments_rubricCriterionLevelId_fkey" FOREIGN KEY ("rubricCriterionLevelId") REFERENCES "rubric_criterion_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubric_criteria" ADD CONSTRAINT "rubric_criteria_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "rubrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubric_criterion_levels" ADD CONSTRAINT "rubric_criterion_levels_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "rubric_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "weeks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "question_banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_bestReplyId_fkey" FOREIGN KEY ("bestReplyId") REFERENCES "forum_replies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_lockedBy_fkey" FOREIGN KEY ("lockedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_attachments" ADD CONSTRAINT "forum_attachments_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_attachments" ADD CONSTRAINT "forum_attachments_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "forum_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_mentions" ADD CONSTRAINT "forum_mentions_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_mentions" ADD CONSTRAINT "forum_mentions_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "forum_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_mentions" ADD CONSTRAINT "forum_mentions_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_mentions" ADD CONSTRAINT "forum_mentions_mentionedBy_fkey" FOREIGN KEY ("mentionedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_settings" ADD CONSTRAINT "course_settings_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_histories" ADD CONSTRAINT "grade_histories_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_histories" ADD CONSTRAINT "grade_histories_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
