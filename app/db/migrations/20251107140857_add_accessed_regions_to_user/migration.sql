-- AlterTable
ALTER TABLE "User"
ADD COLUMN "accessedRegions" JSONB DEFAULT '[]'::jsonb;
