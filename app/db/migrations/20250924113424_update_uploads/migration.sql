-- CreateEnum
CREATE TYPE "MapRenderFormatEnum" AS ENUM('pmtiles', 'geojson');

-- AlterTable
ALTER TABLE "Upload"
DROP COLUMN "type",
DROP COLUMN "url",
ADD COLUMN "mapRenderFormat" "MapRenderFormatEnum" NOT NULL,
ADD COLUMN "mapRenderUrl" TEXT NOT NULL,
ADD COLUMN "pmtilesUrl" TEXT NOT NULL,
ADD COLUMN "geojsonUrl" TEXT NOT NULL,
ADD COLUMN "githubUrl" TEXT NOT NULL;

-- DropEnum
DROP TYPE "UploadTypeEnum";
