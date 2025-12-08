-- CreateEnum
CREATE TYPE "RegionStatus" AS ENUM('PUBLIC', 'PRIVATE', 'DEACTIVATED');

-- AlterTable
ALTER TABLE "Region"
DROP COLUMN "exportPublic",
DROP COLUMN "public",
ADD COLUMN "promoted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "status" "RegionStatus" NOT NULL DEFAULT 'PUBLIC';
