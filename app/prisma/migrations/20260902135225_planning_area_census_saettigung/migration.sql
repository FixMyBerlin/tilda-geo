-- AlterTable
ALTER TABLE "PlanningArea" ADD COLUMN     "censusComputedAt" TIMESTAMP(3),
ADD COLUMN     "censusEwPerHa" DOUBLE PRECISION,
ADD COLUMN     "censusSaettigungEw" DOUBLE PRECISION;
