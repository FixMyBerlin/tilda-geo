-- DropForeignKey
ALTER TABLE "NoteComment" DROP CONSTRAINT "NoteComment_noteId_fkey";

-- AddForeignKey
ALTER TABLE "NoteComment" ADD CONSTRAINT "NoteComment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
