-- CreateEnum
CREATE TYPE "QaSystemStatus" AS ENUM ('GOOD', 'NEEDS_REVIEW', 'PROBLEMATIC');

-- CreateEnum
CREATE TYPE "QaEvaluationStatus" AS ENUM (
    'OK_STRUCTURAL_CHANGE',
    'OK_REFERENCE_ERROR',
    'NOT_OK_DATA_ERROR',
    'NOT_OK_PROCESSING_ERROR'
);

-- CreateEnum
CREATE TYPE "QaEvaluatorType" AS ENUM ('SYSTEM', 'USER');

-- CreateTable
CREATE TABLE "QaConfig" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mapTable" TEXT NOT NULL,
    "goodThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "needsReviewThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "problematicThreshold" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "regionId" INTEGER NOT NULL,
    CONSTRAINT "QaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QaEvaluation" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "areaId" TEXT NOT NULL,
    "systemStatus" "QaSystemStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "userStatus" "QaEvaluationStatus",
    "body" TEXT,
    "configId" INTEGER NOT NULL,
    "evaluatorType" "QaEvaluatorType" NOT NULL DEFAULT 'SYSTEM',
    "userId" INTEGER,
    CONSTRAINT "QaEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QaConfig_regionId_slug_key" ON "QaConfig" ("regionId", "slug");

-- AddForeignKey
ALTER TABLE "QaConfig" ADD CONSTRAINT "QaConfig_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaEvaluation" ADD CONSTRAINT "QaEvaluation_configId_fkey" FOREIGN KEY ("configId") REFERENCES "QaConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaEvaluation" ADD CONSTRAINT "QaEvaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
