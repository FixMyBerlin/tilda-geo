-- CreateEnum
CREATE TYPE "ReviewEntryGeometryType" AS ENUM ('POINT', 'LINESTRING', 'POLYGON', 'MULTIPOINT', 'MULTILINESTRING', 'MULTIPOLYGON');

-- CreateEnum
CREATE TYPE "ReviewEntrySource" AS ENUM ('UPLOAD', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReviewEntryStatus" AS ENUM ('OPEN', 'OK', 'PROBLEM');

-- CreateTable
CREATE TABLE "ReviewList" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "ReviewList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewEntry" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "listId" INTEGER NOT NULL,
    "geometry" JSONB NOT NULL,
    "geometryType" "ReviewEntryGeometryType" NOT NULL,
    "properties" JSONB,
    "importId" TEXT,
    "source" "ReviewEntrySource" NOT NULL DEFAULT 'UPLOAD',
    "sourceMeta" JSONB,
    "status" "ReviewEntryStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "ReviewEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewEntryComment" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "entryId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "ReviewEntryComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RegionToReviewList" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RegionToReviewList_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "ReviewEntry_listId_importId_idx" ON "ReviewEntry"("listId", "importId");

-- CreateIndex
CREATE INDEX "ReviewEntryComment_entryId_idx" ON "ReviewEntryComment"("entryId");

-- CreateIndex
CREATE INDEX "_RegionToReviewList_B_index" ON "_RegionToReviewList"("B");

-- AddForeignKey
ALTER TABLE "ReviewList" ADD CONSTRAINT "ReviewList_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewList" ADD CONSTRAINT "ReviewList_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewEntry" ADD CONSTRAINT "ReviewEntry_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ReviewList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewEntry" ADD CONSTRAINT "ReviewEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewEntry" ADD CONSTRAINT "ReviewEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewEntryComment" ADD CONSTRAINT "ReviewEntryComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewEntryComment" ADD CONSTRAINT "ReviewEntryComment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ReviewEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RegionToReviewList" ADD CONSTRAINT "_RegionToReviewList_A_fkey" FOREIGN KEY ("A") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RegionToReviewList" ADD CONSTRAINT "_RegionToReviewList_B_fkey" FOREIGN KEY ("B") REFERENCES "ReviewList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
