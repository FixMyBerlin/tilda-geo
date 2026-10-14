-- ReviewEntry: take-over of Flächenfinder candidates (source SPACE_FINDER).
-- The origin (Planungsgebiet, Variante, run, H3 cell) is kept in "sourceMeta".
ALTER TYPE "ReviewEntrySource" ADD VALUE 'SPACE_FINDER';
