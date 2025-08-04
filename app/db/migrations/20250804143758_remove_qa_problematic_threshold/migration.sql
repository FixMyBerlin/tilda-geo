/*
Warnings:

- You are about to drop the column `problematicThreshold` on the `QaConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QaConfig"
DROP COLUMN "problematicThreshold";
