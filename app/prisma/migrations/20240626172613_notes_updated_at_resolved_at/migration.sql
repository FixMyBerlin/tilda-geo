/*
  Warnings:

  - You are about to drop the column `resolved` on the `Note` table. All the data in the column will be lost.
  - Made the column `updatedAt` on table `Note` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `NoteComment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Note" DROP COLUMN "resolved",
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "NoteComment" ALTER COLUMN "updatedAt" SET NOT NULL;
