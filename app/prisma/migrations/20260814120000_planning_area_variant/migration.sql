-- Planungsgebiet + Variante: split PlanningScenario into PlanningArea (geometry)
-- and PlanningVariant (assumptions). 1:1 backfill per existing scenario.

-- CreateTable
CREATE TABLE "PlanningArea" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,
    "creatorId" TEXT NOT NULL,
    "studyArea" JSONB NOT NULL,
    "userGeojson" JSONB,
    "userGeojsonMode" TEXT,
    "inputUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningArea_pkey" PRIMARY KEY ("id")
);

-- Backfill areas from existing scenarios (1:1, no geometry merge).
ALTER TABLE "PlanningArea" ADD COLUMN "_legacyScenarioId" INTEGER;

INSERT INTO "PlanningArea" (
    "createdAt",
    "updatedAt",
    "title",
    "regionId",
    "creatorId",
    "studyArea",
    "userGeojson",
    "userGeojsonMode",
    "inputUpdatedAt",
    "_legacyScenarioId"
)
SELECT
    s."createdAt",
    s."updatedAt",
    s."title",
    s."regionId",
    s."creatorId",
    s."factorConfig" -> 'study_area',
    s."factorConfig" -> 'user_geojson',
    s."factorConfig" ->> 'user_geojson_mode',
    s."updatedAt",
    s.id
FROM "PlanningScenario" s
ORDER BY s.id;

-- Link each scenario to its new area.
ALTER TABLE "PlanningScenario" ADD COLUMN "areaId" INTEGER;

UPDATE "PlanningScenario" s
SET "areaId" = a.id
FROM "PlanningArea" a
WHERE a."_legacyScenarioId" = s.id;

ALTER TABLE "PlanningArea" DROP COLUMN "_legacyScenarioId";

-- Strip geometry fields from variant factorConfig.
UPDATE "PlanningScenario"
SET "factorConfig" = "factorConfig" - 'study_area' - 'user_geojson' - 'user_geojson_mode';

-- Drop region FK before removing column.
ALTER TABLE "PlanningScenario" DROP CONSTRAINT "PlanningScenario_regionId_fkey";

ALTER TABLE "PlanningScenario" DROP COLUMN "regionId";

ALTER TABLE "PlanningScenario" ALTER COLUMN "areaId" SET NOT NULL;

-- Rename scenario → variant.
ALTER TABLE "PlanningScenario" RENAME TO "PlanningVariant";

ALTER TABLE "PlanningVariant" RENAME CONSTRAINT "PlanningScenario_pkey" TO "PlanningVariant_pkey";

ALTER TABLE "PlanningVariant" RENAME CONSTRAINT "PlanningScenario_parentId_fkey" TO "PlanningVariant_parentId_fkey";

ALTER TABLE "PlanningVariant" RENAME CONSTRAINT "PlanningScenario_creatorId_fkey" TO "PlanningVariant_creatorId_fkey";

-- PlanningRun: scenarioId → variantId, add stale.
ALTER TABLE "PlanningRun" RENAME COLUMN "scenarioId" TO "variantId";

ALTER TABLE "PlanningRun" ADD COLUMN "stale" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "PlanningRun" RENAME CONSTRAINT "PlanningRun_scenarioId_fkey" TO "PlanningRun_variantId_fkey";

DROP INDEX "PlanningRun_scenarioId_idx";

CREATE INDEX "PlanningRun_variantId_idx" ON "PlanningRun" ("variantId");

-- PlanningJob: scenarioId → variantId.
ALTER TABLE "PlanningJob" RENAME COLUMN "scenarioId" TO "variantId";

ALTER TABLE "PlanningJob" RENAME CONSTRAINT "PlanningJob_scenarioId_fkey" TO "PlanningJob_variantId_fkey";

DROP INDEX "PlanningJob_scenarioId_idx";

CREATE INDEX "PlanningJob_variantId_idx" ON "PlanningJob" ("variantId");

-- PlanningArea indexes and FKs.
CREATE INDEX "PlanningArea_regionId_idx" ON "PlanningArea" ("regionId");

ALTER TABLE "PlanningArea"
ADD CONSTRAINT "PlanningArea_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PlanningArea"
ADD CONSTRAINT "PlanningArea_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PlanningVariant area FK (replaces region FK).
CREATE INDEX "PlanningVariant_areaId_idx" ON "PlanningVariant" ("areaId");

ALTER TABLE "PlanningVariant"
ADD CONSTRAINT "PlanningVariant_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "PlanningArea" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update PlanningRun/PlanningJob FKs to point at renamed table.
ALTER TABLE "PlanningRun" DROP CONSTRAINT "PlanningRun_variantId_fkey";

ALTER TABLE "PlanningRun"
ADD CONSTRAINT "PlanningRun_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "PlanningVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlanningJob" DROP CONSTRAINT "PlanningJob_variantId_fkey";

ALTER TABLE "PlanningJob"
ADD CONSTRAINT "PlanningJob_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "PlanningVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
