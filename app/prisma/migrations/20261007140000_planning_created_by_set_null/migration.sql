-- PlanningArea/PlanningVariant: creatorId -> createdById (optional, SET NULL), like NoteFolder/ReviewList.
-- Renamed in place so the existing creator data is kept.
ALTER TABLE "PlanningArea" RENAME COLUMN "creatorId" TO "createdById";
ALTER TABLE "PlanningArea" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "PlanningArea" DROP CONSTRAINT "PlanningArea_creatorId_fkey";
ALTER TABLE "PlanningArea"
  ADD CONSTRAINT "PlanningArea_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlanningVariant" RENAME COLUMN "creatorId" TO "createdById";
ALTER TABLE "PlanningVariant" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "PlanningVariant" DROP CONSTRAINT "PlanningVariant_creatorId_fkey";
ALTER TABLE "PlanningVariant"
  ADD CONSTRAINT "PlanningVariant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
