-- DropForeignKey
ALTER TABLE "PlanningVariant"
DROP CONSTRAINT "PlanningVariant_parentId_fkey";

-- AddForeignKey
ALTER TABLE "PlanningVariant"
ADD CONSTRAINT "PlanningVariant_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PlanningVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
