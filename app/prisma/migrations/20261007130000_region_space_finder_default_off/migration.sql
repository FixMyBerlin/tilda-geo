-- Flächenfinder is opt-in per region. Regions that already have planning areas keep it on.
ALTER TABLE "Region" ALTER COLUMN "spaceFinderEnabled" SET DEFAULT false;

UPDATE "Region" r SET "spaceFinderEnabled" = false
WHERE NOT EXISTS (SELECT 1 FROM "PlanningArea" pa WHERE pa."regionId" = r.id);
