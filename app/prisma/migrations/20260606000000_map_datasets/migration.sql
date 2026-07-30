-- Rename StaticDatasetCategory -> MapDatasetCategory, Upload -> MapDatasetUpload,
-- add file metadata columns + MapDatasetLayerConfig, then clear uploads.
--
-- Clean slate: TRUNCATE MapDatasetUpload. Recreate with
--   bun run static-datasets-update -- --env=<dev|staging|production>
-- then `bun run migration-data-masks`. See app/scripts/migration-data/README.md.

ALTER TABLE "StaticDatasetCategory" RENAME TO "MapDatasetCategory";
ALTER TABLE "MapDatasetCategory" RENAME CONSTRAINT "StaticDatasetCategory_pkey" TO "MapDatasetCategory_pkey";
ALTER INDEX "StaticDatasetCategory_key_key" RENAME TO "MapDatasetCategory_key_key";
ALTER INDEX "StaticDatasetCategory_groupKey_categoryKey_key" RENAME TO "MapDatasetCategory_groupKey_categoryKey_key";
ALTER INDEX "StaticDatasetCategory_groupKey_sortOrder_categoryKey_idx" RENAME TO "MapDatasetCategory_groupKey_sortOrder_categoryKey_idx";
ALTER SEQUENCE "StaticDatasetCategory_id_seq" RENAME TO "MapDatasetCategory_id_seq";

ALTER TYPE "UploadCreatedByEnum" RENAME TO "MapDatasetUploadCreatedBy";

ALTER TABLE "Upload" RENAME TO "MapDatasetUpload";
ALTER TABLE "MapDatasetUpload" RENAME CONSTRAINT "Upload_pkey" TO "MapDatasetUpload_pkey";
ALTER INDEX "Upload_slug_key" RENAME TO "MapDatasetUpload_slug_key";
ALTER SEQUENCE "Upload_id_seq" RENAME TO "MapDatasetUpload_id_seq";

ALTER TABLE "_RegionToUpload" DROP CONSTRAINT IF EXISTS "_RegionToUpload_A_fkey";
ALTER TABLE "_RegionToUpload" DROP CONSTRAINT IF EXISTS "_RegionToUpload_B_fkey";
ALTER TABLE "_RegionToUpload" DROP CONSTRAINT IF EXISTS "_RegionToUpload_AB_pkey";

UPDATE "_RegionToUpload" SET "A" = "B", "B" = "A";

ALTER TABLE "_RegionToUpload" RENAME TO "_RegionToMapDatasetUpload";
ALTER INDEX "_RegionToUpload_B_index" RENAME TO "_RegionToMapDatasetUpload_B_index";
ALTER TABLE "_RegionToMapDatasetUpload" ADD CONSTRAINT "_RegionToMapDatasetUpload_AB_pkey" PRIMARY KEY ("A", "B");

ALTER TABLE "_RegionToMapDatasetUpload" ADD CONSTRAINT "_RegionToMapDatasetUpload_A_fkey" FOREIGN KEY ("A") REFERENCES "MapDatasetUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_RegionToMapDatasetUpload" ADD CONSTRAINT "_RegionToMapDatasetUpload_B_fkey" FOREIGN KEY ("B") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "AuditLog" SET "model" = 'MapDatasetUpload' WHERE "model" = 'Upload';

ALTER TABLE "MapDatasetUpload"
  ADD COLUMN "attributionHtml" TEXT,
  ADD COLUMN "dataSourceMarkdown" TEXT,
  ADD COLUMN "dataUpdatedNote" TEXT,
  ADD COLUMN "licence" TEXT,
  ADD COLUMN "licenceOsmCompatible" TEXT;

CREATE TABLE "MapDatasetLayerConfig" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mapDatasetUploadId" INTEGER NOT NULL,
    "subId" TEXT,
    "name" TEXT NOT NULL,
    "categoryKey" TEXT,
    "layers" JSONB NOT NULL,
    "inspector" JSONB NOT NULL,
    "legends" JSONB,
    "osmIdConfig" JSONB,
    "description" TEXT,

    CONSTRAINT "MapDatasetLayerConfig_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MapDatasetLayerConfig_categoryKey_idx" ON "MapDatasetLayerConfig"("categoryKey");

CREATE UNIQUE INDEX "MapDatasetLayerConfig_mapDatasetUploadId_subId_key" ON "MapDatasetLayerConfig"("mapDatasetUploadId", "subId");

ALTER TABLE "MapDatasetLayerConfig" ADD CONSTRAINT "MapDatasetLayerConfig_mapDatasetUploadId_fkey" FOREIGN KEY ("mapDatasetUploadId") REFERENCES "MapDatasetUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Clean slate: wipe legacy uploads (and M2M / layer-config rows). Full StaticDatasets recreates them.
TRUNCATE TABLE "MapDatasetUpload" RESTART IDENTITY CASCADE;

ALTER TABLE "MapDatasetUpload"
ADD CONSTRAINT "MapDatasetUpload_configs_is_array_check"
CHECK (jsonb_typeof("configs") = 'array');
