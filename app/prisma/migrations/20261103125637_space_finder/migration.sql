-- Flächenfinder (SpaceFinder*): areas (Planungsgebiete), variants, runs and jobs.
-- One migration squashed from the 14 development migrations of the flaechenfinder-module branch.
-- The Flächenfinder instance had those applied already; it was moved to this state by hand,
-- see docs/Flaechenfinder-Migration-Squash.md.

-- CreateEnum
CREATE TYPE "SpaceFinderRunStatus" AS ENUM ('PENDING', 'COMPLETE', 'EMPTY');

-- CreateEnum
CREATE TYPE "SpaceFinderJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');

-- AlterEnum
ALTER TYPE "ReviewEntrySource" ADD VALUE 'SPACE_FINDER';

-- AlterTable
ALTER TABLE "Region" ADD COLUMN     "spaceFinderEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SpaceFinderArea" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,
    "createdById" TEXT,
    "studyArea" JSONB NOT NULL,
    "userDatasets" JSONB NOT NULL DEFAULT '[]',
    "useCase" TEXT NOT NULL DEFAULT 'fahrradbox',
    "areaSizeM2" DOUBLE PRECISION,
    "inputUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "censusSaettigungEw" DOUBLE PRECISION,
    "censusEwPerHa" DOUBLE PRECISION,
    "censusComputedAt" TIMESTAMP(3),

    CONSTRAINT "SpaceFinderArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceFinderVariant" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "areaId" INTEGER NOT NULL,
    "createdById" TEXT,
    "parentId" INTEGER,
    "factorConfig" JSONB NOT NULL,
    "currentRunId" INTEGER,

    CONSTRAINT "SpaceFinderVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceFinderRun" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "variantId" INTEGER NOT NULL,
    "factorConfigSnapshot" JSONB NOT NULL,
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "status" "SpaceFinderRunStatus" NOT NULL DEFAULT 'PENDING',
    "hexCount" INTEGER,
    "vegCount" INTEGER,
    "cirAttribution" TEXT,

    CONSTRAINT "SpaceFinderRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceFinderJob" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "variantId" INTEGER NOT NULL,
    "status" "SpaceFinderJobStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "progress" INTEGER,
    "progressLabel" TEXT,
    "resultRunId" INTEGER,

    CONSTRAINT "SpaceFinderJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpaceFinderArea_regionId_idx" ON "SpaceFinderArea"("regionId");

-- CreateIndex
CREATE INDEX "SpaceFinderVariant_areaId_idx" ON "SpaceFinderVariant"("areaId");

-- CreateIndex
CREATE INDEX "SpaceFinderRun_variantId_idx" ON "SpaceFinderRun"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceFinderJob_resultRunId_key" ON "SpaceFinderJob"("resultRunId");

-- CreateIndex
CREATE INDEX "SpaceFinderJob_status_idx" ON "SpaceFinderJob"("status");

-- CreateIndex
CREATE INDEX "SpaceFinderJob_variantId_idx" ON "SpaceFinderJob"("variantId");

-- AddForeignKey
ALTER TABLE "SpaceFinderArea" ADD CONSTRAINT "SpaceFinderArea_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceFinderArea" ADD CONSTRAINT "SpaceFinderArea_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceFinderVariant" ADD CONSTRAINT "SpaceFinderVariant_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "SpaceFinderArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceFinderVariant" ADD CONSTRAINT "SpaceFinderVariant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceFinderVariant" ADD CONSTRAINT "SpaceFinderVariant_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SpaceFinderVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceFinderRun" ADD CONSTRAINT "SpaceFinderRun_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "SpaceFinderVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceFinderJob" ADD CONSTRAINT "SpaceFinderJob_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "SpaceFinderVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceFinderJob" ADD CONSTRAINT "SpaceFinderJob_resultRunId_fkey" FOREIGN KEY ("resultRunId") REFERENCES "SpaceFinderRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
