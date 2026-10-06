-- Note folders: every internal note moves into one folder; folders are shared with regions (m:n).
-- Order matters: existing notes need a folder before "folderId" can become NOT NULL, and
-- "Note"."regionId" is dropped only after the backfill used it.

-- 1. New tables (keep Prisma-generated DDL for NoteFolder, _NoteFolderToRegion, their FKs/indexes)
CREATE TABLE "NoteFolder" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    CONSTRAINT "NoteFolder_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "_NoteFolderToRegion" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_NoteFolderToRegion_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX "_NoteFolderToRegion_B_index" ON "_NoteFolderToRegion"("B");
ALTER TABLE "NoteFolder" ADD CONSTRAINT "NoteFolder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NoteFolder" ADD CONSTRAINT "NoteFolder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_NoteFolderToRegion" ADD CONSTRAINT "_NoteFolderToRegion_A_fkey" FOREIGN KEY ("A") REFERENCES "NoteFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_NoteFolderToRegion" ADD CONSTRAINT "_NoteFolderToRegion_B_fkey" FOREIGN KEY ("B") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Nullable first so existing rows survive
ALTER TABLE "Note" ADD COLUMN "folderId" INTEGER;

-- 3. Backfill: one "Allgemein" folder per region with internal notes enabled or with existing notes
DO $$
DECLARE
  r RECORD;
  new_folder_id INTEGER;
BEGIN
  FOR r IN
    SELECT reg.id AS region_id
    FROM "Region" reg
    WHERE reg."notesInternal" = true
       OR EXISTS (SELECT 1 FROM "Note" n WHERE n."regionId" = reg.id)
  LOOP
    INSERT INTO "NoteFolder" ("name", "createdAt", "updatedAt")
    VALUES ('Allgemein', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id INTO new_folder_id;

    INSERT INTO "_NoteFolderToRegion" ("A", "B") VALUES (new_folder_id, r.region_id);

    UPDATE "Note" SET "folderId" = new_folder_id WHERE "regionId" = r.region_id;
  END LOOP;

  IF EXISTS (SELECT 1 FROM "Note" WHERE "folderId" IS NULL) THEN
    RAISE EXCEPTION 'note_folders backfill left notes without a folder';
  END IF;
END $$;

-- 4. Enforce
ALTER TABLE "Note" ALTER COLUMN "folderId" SET NOT NULL;
CREATE INDEX "Note_folderId_idx" ON "Note"("folderId");
ALTER TABLE "Note" ADD CONSTRAINT "Note_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "NoteFolder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. Region is now derived from the folder
ALTER TABLE "Note" DROP CONSTRAINT "Note_regionId_fkey";
ALTER TABLE "Note" DROP COLUMN "regionId";
