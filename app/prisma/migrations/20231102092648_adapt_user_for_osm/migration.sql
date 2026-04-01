ALTER TABLE "User"
  RENAME COLUMN "lastName" TO name;

ALTER TABLE "User"
  DROP COLUMN "firstName",
  ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "User"
  ADD COLUMN "osmId" INTEGER;

UPDATE "User" SET "osmId" = id;
ALTER TABLE "User" ALTER COLUMN "osmId" SET NOT NULL;

CREATE UNIQUE INDEX "User_osmId_key" ON "User"("osmId");
