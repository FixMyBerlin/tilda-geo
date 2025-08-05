-- AlterTable
ALTER TABLE "QaConfig"
ALTER COLUMN "goodThreshold"
SET DEFAULT 0.1,
ALTER COLUMN "needsReviewThreshold"
SET DEFAULT 0.2;
