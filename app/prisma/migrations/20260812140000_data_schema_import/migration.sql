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
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "DataSchemaImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataSchemaImport_tableName_createdAt_idx" ON "DataSchemaImport"("tableName", "createdAt");

-- AddForeignKey
ALTER TABLE "DataSchemaImport" ADD CONSTRAINT "DataSchemaImport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSchemaImport" ADD CONSTRAINT "DataSchemaImport_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
