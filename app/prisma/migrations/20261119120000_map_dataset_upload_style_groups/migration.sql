-- Style groups of a static dataset; null keeps every config as its own sidebar entry.
ALTER TABLE "MapDatasetUpload" ADD COLUMN "styleGroups" JSONB;
