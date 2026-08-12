-- CreateEnum
CREATE TYPE "DataSchemaImportStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "DataSchemaImport" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tableName" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "snapshotId" TEXT,
    "sha256" TEXT NOT NULL,
    "status" "DataSchemaImportStatus" NOT NULL DEFAULT 'PENDING',
    "rowCount" INTEGER,
    "durationMs" INTEGER,
    "errorText" TEXT,
    "userId" TEXT,

    CONSTRAINT "DataSchemaImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataSchemaImport_tableName_createdAt_idx" ON "DataSchemaImport"("tableName", "createdAt");
