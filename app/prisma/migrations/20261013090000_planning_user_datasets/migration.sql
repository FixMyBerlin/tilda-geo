-- AlterTable
ALTER TABLE "PlanningArea"
ADD COLUMN "userDatasets" JSONB NOT NULL DEFAULT '[]';

-- Backfill: the single former upload becomes dataset "d1" (name, mode and file stay).
UPDATE "PlanningArea"
SET
  "userDatasets" = jsonb_build_array(
    jsonb_build_object(
      'id', 'd1',
      'name', 'Eigene Daten',
      'mode', COALESCE("userGeojsonMode", 'bonus'),
      'geojson', "userGeojson"
    )
  )
WHERE
  "userGeojson" IS NOT NULL;

-- The strength moves from weights.w_eigendaten to eigendaten_weights.d1 (only for areas that have data).
UPDATE "PlanningVariant" v
SET
  "factorConfig" = jsonb_set(
    "factorConfig" #- '{weights,w_eigendaten}',
    '{eigendaten_weights}',
    jsonb_build_object('d1', COALESCE(("factorConfig" -> 'weights' ->> 'w_eigendaten')::double precision, 0))
  )
FROM "PlanningArea" a
WHERE
  v."areaId" = a.id
  AND a."userGeojson" IS NOT NULL;

-- Areas without data: just drop the now unused weight.
UPDATE "PlanningVariant"
SET
  "factorConfig" = "factorConfig" #- '{weights,w_eigendaten}'
WHERE
  "factorConfig" -> 'weights' ? 'w_eigendaten';

-- "userGeojson" / "userGeojsonMode" stay for now: the planning-worker is deployed separately from
-- the app and still selects them until its new image runs. Drop them in a follow-up migration.
