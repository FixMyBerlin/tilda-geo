-- CreateEnum
CREATE TYPE "PlanningRunStatus" AS ENUM ('PENDING', 'COMPLETE', 'EMPTY');

-- CreateEnum
CREATE TYPE "PlanningJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "PlanningScenario" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "regionId" INTEGER NOT NULL,
    "creatorId" TEXT NOT NULL,
    "parentId" INTEGER,
    "factorConfig" JSONB NOT NULL,
    "currentRunId" INTEGER,

    CONSTRAINT "PlanningScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningRun" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenarioId" INTEGER NOT NULL,
    "factorConfigSnapshot" JSONB NOT NULL,
    "status" "PlanningRunStatus" NOT NULL DEFAULT 'PENDING',
    "hexCount" INTEGER,
    "areaCount" INTEGER,

    CONSTRAINT "PlanningRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningJob" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" INTEGER NOT NULL,
    "status" "PlanningJobStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "resultRunId" INTEGER,

    CONSTRAINT "PlanningJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningScenario_regionId_idx" ON "PlanningScenario"("regionId");

-- CreateIndex
CREATE INDEX "PlanningRun_scenarioId_idx" ON "PlanningRun"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningJob_resultRunId_key" ON "PlanningJob"("resultRunId");

-- CreateIndex
CREATE INDEX "PlanningJob_status_idx" ON "PlanningJob"("status");

-- CreateIndex
CREATE INDEX "PlanningJob_scenarioId_idx" ON "PlanningJob"("scenarioId");

-- AddForeignKey
ALTER TABLE "PlanningScenario" ADD CONSTRAINT "PlanningScenario_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningScenario" ADD CONSTRAINT "PlanningScenario_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningScenario" ADD CONSTRAINT "PlanningScenario_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PlanningScenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningRun" ADD CONSTRAINT "PlanningRun_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "PlanningScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningJob" ADD CONSTRAINT "PlanningJob_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "PlanningScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningJob" ADD CONSTRAINT "PlanningJob_resultRunId_fkey" FOREIGN KEY ("resultRunId") REFERENCES "PlanningRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
