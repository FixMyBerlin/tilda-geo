-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "cacheTtlSeconds" INTEGER DEFAULT 86400,
ADD COLUMN     "externalSourceUrl" TEXT,
ALTER COLUMN "pmtilesUrl" DROP NOT NULL,
ALTER COLUMN "geojsonUrl" DROP NOT NULL;
