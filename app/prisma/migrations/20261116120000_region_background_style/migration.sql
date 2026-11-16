-- Existing regions keep the Atlas style; new regions get the dataviz style.
ALTER TABLE "Region" ADD COLUMN "backgroundStyle" TEXT NOT NULL DEFAULT 'atlas';
ALTER TABLE "Region" ALTER COLUMN "backgroundStyle" SET DEFAULT 'dataviz';
