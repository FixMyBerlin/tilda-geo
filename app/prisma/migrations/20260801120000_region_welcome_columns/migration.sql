-- Welcome content as scalar columns + JSON sections on Region (replaces RegionWelcome tables).

-- AlterTable
ALTER TABLE "Region" ADD COLUMN "welcomeBodyMarkdown" TEXT,
ADD COLUMN "welcomeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "welcomeImageAltText" TEXT,
ADD COLUMN "welcomeImageUploadId" INTEGER,
ADD COLUMN "welcomeSections" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "welcomeSubtitle" TEXT,
ADD COLUMN "welcomeTitle" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Region_welcomeImageUploadId_idx" ON "Region"("welcomeImageUploadId");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_welcomeImageUploadId_fkey" FOREIGN KEY ("welcomeImageUploadId") REFERENCES "RegionUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
