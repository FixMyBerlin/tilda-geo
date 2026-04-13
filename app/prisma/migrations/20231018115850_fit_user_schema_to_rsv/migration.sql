ALTER TABLE "User"
  RENAME COLUMN name TO "lastName";

ALTER TABLE "User"
  ADD COLUMN "firstName" TEXT;

ALTER TABLE "User"
  ADD COLUMN "phone" TEXT;
