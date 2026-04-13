/*
  Warnings:

  - You are about to drop the column `regionId` on the `Upload` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Upload" DROP CONSTRAINT "Upload_regionId_fkey";

-- AlterTable
ALTER TABLE "Upload" DROP COLUMN "regionId";

-- CreateTable
CREATE TABLE "_RegionToUpload" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_RegionToUpload_AB_unique" ON "_RegionToUpload"("A", "B");

-- CreateIndex
CREATE INDEX "_RegionToUpload_B_index" ON "_RegionToUpload"("B");

-- AddForeignKey
ALTER TABLE "_RegionToUpload" ADD CONSTRAINT "_RegionToUpload_A_fkey" FOREIGN KEY ("A") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RegionToUpload" ADD CONSTRAINT "_RegionToUpload_B_fkey" FOREIGN KEY ("B") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Upload" ADD COLUMN     "public" BOOLEAN NOT NULL DEFAULT false;
