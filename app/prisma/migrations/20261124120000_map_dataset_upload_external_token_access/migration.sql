-- Opt-in per upload: only these non-public uploads are served to a TILDA external API token (Bearer).
ALTER TABLE "MapDatasetUpload" ADD COLUMN "externalTokenAccess" BOOLEAN NOT NULL DEFAULT false;
