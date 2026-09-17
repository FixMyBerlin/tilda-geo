-- Replace mutually exclusive RegionNotesMode with independent OSM / internal note flags.

ALTER TABLE "Region"
ADD COLUMN "notesOsm" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "notesInternal" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Region"
SET
  "notesOsm" = true,
  "notesInternal" = false
WHERE "notes" = 'osmNotes';

UPDATE "Region"
SET
  "notesOsm" = false,
  "notesInternal" = true
WHERE "notes" = 'internalNotes';

ALTER TABLE "Region" DROP COLUMN "notes";

DROP TYPE "RegionNotesMode";

ALTER TABLE "Region" ALTER COLUMN "notesOsm" SET DEFAULT true;

ALTER TABLE "Region" ALTER COLUMN "notesInternal" SET DEFAULT false;
