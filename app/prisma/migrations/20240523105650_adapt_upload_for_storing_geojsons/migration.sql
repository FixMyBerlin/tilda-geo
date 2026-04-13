-- CreateEnum
CREATE TYPE "UploadCreatedByEnum" AS ENUM ('USER', 'SCRIPT');

-- CreateEnum
CREATE TYPE "UploadTypeEnum" AS ENUM ('GEOJSON', 'PMTILES');

-- AlterTable
ALTER TABLE "Upload"
  RENAME COLUMN "pmtilesUrl" TO "url";
ALTER TABLE "Upload"
  ADD COLUMN "createdBy" "UploadCreatedByEnum" NOT NULL DEFAULT 'SCRIPT',
  ADD COLUMN "type"      "UploadTypeEnum"      NOT NULL DEFAULT 'PMTILES';
