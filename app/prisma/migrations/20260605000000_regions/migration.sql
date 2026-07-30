-- Regions DB config, contracts, uploads, config templates, audit log, and admin API tokens.

-- CreateEnum
CREATE TYPE "RegionProduct" AS ENUM ('radverkehr', 'parkraum', 'fussverkehr', 'analysis');

-- CreateEnum
CREATE TYPE "RegionNotesMode" AS ENUM ('osmNotes', 'internalNotes', 'disabled');

-- CreateEnum
CREATE TYPE "RegionContractStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Region" ADD COLUMN     "bbox" JSONB,
ADD COLUMN     "cacheWarming" JSONB,
ADD COLUMN     "contractId" INTEGER,
ADD COLUMN     "fullName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "headerLogoId" INTEGER,
ADD COLUMN     "logoWhiteBackgroundRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mapLat" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "mapLng" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "mapZoom" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN     "maskBufferKm" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN     "maskOsmRelationIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "notes" "RegionNotesMode" NOT NULL DEFAULT 'osmNotes',
ADD COLUMN     "product" "RegionProduct" NOT NULL DEFAULT 'radverkehr',
ADD COLUMN     "showSearch" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RegionContract" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RegionContractStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "RegionContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionCategoryAssignment" (
    "id" SERIAL NOT NULL,
    "regionId" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "RegionCategoryAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionBackgroundAssignment" (
    "id" SERIAL NOT NULL,
    "regionId" INTEGER NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "RegionBackgroundAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionExportAssignment" (
    "id" SERIAL NOT NULL,
    "regionId" INTEGER NOT NULL,
    "exportId" TEXT NOT NULL,

    CONSTRAINT "RegionExportAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionNavigationLink" (
    "id" SERIAL NOT NULL,
    "regionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "internalPath" TEXT,
    "externalUrl" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "RegionNavigationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionConfigTemplate" (
    "checksum" TEXT NOT NULL,
    "template" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegionConfigTemplate_pkey" PRIMARY KEY ("checksum")
);

-- CreateTable
CREATE TABLE "RegionUpload" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "regionId" INTEGER NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "RegionUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "recordId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "changedFields" TEXT[],
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminApiToken" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,

    CONSTRAINT "AdminApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegionContract_slug_key" ON "RegionContract"("slug");

-- CreateIndex
CREATE INDEX "Region_contractId_idx" ON "Region"("contractId");

-- CreateIndex
CREATE INDEX "Region_headerLogoId_idx" ON "Region"("headerLogoId");

-- CreateIndex
CREATE UNIQUE INDEX "RegionCategoryAssignment_regionId_categoryId_key" ON "RegionCategoryAssignment"("regionId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "RegionBackgroundAssignment_regionId_sourceId_key" ON "RegionBackgroundAssignment"("regionId", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "RegionExportAssignment_regionId_exportId_key" ON "RegionExportAssignment"("regionId", "exportId");

-- CreateIndex
CREATE UNIQUE INDEX "RegionUpload_s3Key_key" ON "RegionUpload"("s3Key");

-- CreateIndex
CREATE INDEX "RegionUpload_regionId_idx" ON "RegionUpload"("regionId");

-- CreateIndex
CREATE INDEX "AuditLog_model_recordId_idx" ON "AuditLog"("model", "recordId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminApiToken_hashedToken_key" ON "AdminApiToken"("hashedToken");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "RegionContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_headerLogoId_fkey" FOREIGN KEY ("headerLogoId") REFERENCES "RegionUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionCategoryAssignment" ADD CONSTRAINT "RegionCategoryAssignment_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionBackgroundAssignment" ADD CONSTRAINT "RegionBackgroundAssignment_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionExportAssignment" ADD CONSTRAINT "RegionExportAssignment_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionNavigationLink" ADD CONSTRAINT "RegionNavigationLink_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionUpload" ADD CONSTRAINT "RegionUpload_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminApiToken" ADD CONSTRAINT "AdminApiToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
