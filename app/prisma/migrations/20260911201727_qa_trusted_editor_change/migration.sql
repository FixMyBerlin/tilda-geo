-- AlterEnum
ALTER TYPE "QaSystemStatus" ADD VALUE 'TRUSTED_EDITOR_CHANGE';

-- AlterTable
ALTER TABLE "QaConfig" ADD COLUMN     "trustedOsmUsernames" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "referenceFrozenAt" DATE;

-- Backfill: 2026 slugs use the 2026 voronoi baseline (data.euvm_qa_voronoi_2026), others the 2025 baseline (data.euvm_qa_voronoi)
UPDATE "QaConfig" SET "referenceFrozenAt" = DATE '2026-03-02' WHERE slug LIKE '%2026%';
UPDATE "QaConfig" SET "referenceFrozenAt" = DATE '2025-06-30' WHERE slug NOT LIKE '%2026%';

ALTER TABLE "QaConfig" ALTER COLUMN "referenceFrozenAt" SET NOT NULL;
