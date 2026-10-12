-- QA configs check several indicators per cell instead of one count.
-- A config names its dataset, its cell table (with a filter) and its reference table, and lists
-- its indicators with their thresholds. Every evaluation belongs to one indicator.
-- All existing configs are the eUVM parking QA. They checked the number of spaces ("total") and
-- get "condition_category_primary" as a second indicator.

-- 1. QaConfig: new columns
CREATE TYPE "QaAreaFilter" AS ENUM ('all', 'priority', 'non_priority', 'with_reference');

ALTER TABLE "QaConfig"
ADD COLUMN "dataset" TEXT NOT NULL DEFAULT 'parking_euvm',
ADD COLUMN "areaTable" TEXT NOT NULL DEFAULT 'data.euvm_qa_voronoi_2026',
ADD COLUMN "areaFilter" "QaAreaFilter" NOT NULL DEFAULT 'all',
ADD COLUMN "referenceTable" TEXT NOT NULL DEFAULT 'data.qa_parkings_euvm_reference_2026',
ADD COLUMN "indicators" JSONB;

ALTER TABLE "QaConfig"
ALTER COLUMN "dataset" DROP DEFAULT,
ALTER COLUMN "areaTable" DROP DEFAULT,
ALTER COLUMN "referenceTable" DROP DEFAULT;

-- The old deviation was max/min - 1, the new one is |reference - current| / max = 1 - min/max.
-- A threshold t becomes t / (1 + t), so every cell keeps its status.
CREATE FUNCTION pg_temp.qa_threshold(t NUMERIC) RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT ROUND(t / (1 + t), 4)
$$;

-- The priority cells were a config of their own, told apart by the name of its map table.
-- `mapTable` is schema-qualified now.
UPDATE "QaConfig"
SET
  "areaFilter" = CASE WHEN "mapTable" LIKE '%\_priority' THEN 'priority' ELSE 'non_priority' END::"QaAreaFilter",
  "mapTable" = CASE WHEN "mapTable" LIKE '%.%' THEN "mapTable" ELSE 'public.' || "mapTable" END,
  -- The second indicator is new: the same thresholds, on the spaces per Parkbeschränkung.
  "indicators" = jsonb_build_array(
    jsonb_build_object(
      'key', 'total',
      'label', 'Stellplätze',
      'goodThreshold', pg_temp.qa_threshold("goodThreshold"::NUMERIC),
      'needsReviewThreshold', pg_temp.qa_threshold("needsReviewThreshold"::NUMERIC),
      'absoluteDifferenceThreshold', "absoluteDifferenceThreshold"
    ),
    jsonb_build_object(
      'key', 'condition_category_primary',
      'label', 'Parkbeschränkung',
      'goodThreshold', pg_temp.qa_threshold("goodThreshold"::NUMERIC),
      'needsReviewThreshold', pg_temp.qa_threshold("needsReviewThreshold"::NUMERIC),
      'absoluteDifferenceThreshold', "absoluteDifferenceThreshold"
    )
  );

ALTER TABLE "QaConfig" ALTER COLUMN "indicators" SET NOT NULL;

-- 2. QaEvaluation: every evaluation belongs to an indicator
ALTER TABLE "QaEvaluation" ADD COLUMN "indicatorKey" TEXT NOT NULL DEFAULT 'total';

ALTER TABLE "QaEvaluation" ALTER COLUMN "indicatorKey" DROP DEFAULT;

DROP INDEX "QaEvaluation_configId_areaId_createdAt_id_idx";

CREATE INDEX "QaEvaluation_configId_areaId_indicatorKey_createdAt_id_idx" ON "QaEvaluation" ("configId", "areaId", "indicatorKey", "createdAt" DESC, "id" DESC);

-- 3. QaEvaluation.decisionData: the stored numbers of every evaluation in the new shape
-- (qaDecisionDataSchema.ts). The old values are JSON numbers, numeric strings, empty strings or
-- null; thresholds come from the snapshot, else from the config.
WITH old AS (
  SELECT
    e.id,
    COALESCE(NULLIF(e."decisionData" ->> 'referenceCount', '')::NUMERIC, 0) AS reference,
    COALESCE(NULLIF(e."decisionData" ->> 'currentCount', '')::NUMERIC, 0) AS current,
    COALESCE(NULLIF(e."decisionData" ->> 'goodThreshold', '')::NUMERIC, c."goodThreshold"::NUMERIC) AS good,
    COALESCE(NULLIF(e."decisionData" ->> 'needsReviewThreshold', '')::NUMERIC, c."needsReviewThreshold"::NUMERIC) AS review,
    c."absoluteDifferenceThreshold" AS absolute
  FROM "QaEvaluation" e
  JOIN "QaConfig" c ON c.id = e."configId"
  WHERE e."decisionData" IS NOT NULL
)
UPDATE "QaEvaluation" e
SET "decisionData" = jsonb_build_object(
  'reference', old.reference,
  'current', old.current,
  'difference', ABS(old.reference - old.current),
  'deviation', CASE
    WHEN GREATEST(old.reference, old.current) = 0 THEN 0
    ELSE ROUND(ABS(old.reference - old.current) / GREATEST(old.reference, old.current), 4)
  END,
  'thresholds', jsonb_build_object(
    'goodThreshold', pg_temp.qa_threshold(old.good),
    'needsReviewThreshold', pg_temp.qa_threshold(old.review),
    'absoluteDifferenceThreshold', old.absolute
  )
)
FROM old
WHERE old.id = e.id;

-- 4. QaConfig: the thresholds live in `indicators` now
ALTER TABLE "QaConfig"
DROP COLUMN "goodThreshold",
DROP COLUMN "needsReviewThreshold",
DROP COLUMN "absoluteDifferenceThreshold";
