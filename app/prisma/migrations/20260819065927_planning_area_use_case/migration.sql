-- AlterTable
ALTER TABLE "PlanningArea"
ADD COLUMN "areaSizeM2" DOUBLE PRECISION,
ADD COLUMN "useCase" TEXT NOT NULL DEFAULT 'fahrradbox';

-- Backfill from the oldest variant per area (if variants disagree, oldest wins).
UPDATE "PlanningArea" a
SET
  "useCase" = COALESCE(v."factorConfig" ->> 'use_case', 'fahrradbox'),
  "areaSizeM2" = (v."factorConfig" ->> 'area_size_m2')::double precision
FROM (
  SELECT DISTINCT ON ("areaId")
    "areaId",
    "factorConfig"
  FROM
    "PlanningVariant"
  ORDER BY
    "areaId",
    "createdAt",
    id
) v
WHERE
  a.id = v."areaId";

-- Strip moved keys from every variant JSON.
UPDATE "PlanningVariant"
SET
  "factorConfig" = "factorConfig" - 'use_case' - 'area_size_m2';
