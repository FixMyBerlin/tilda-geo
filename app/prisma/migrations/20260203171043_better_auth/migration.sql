/*
Warnings:

- The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
- You are about to drop the column `antiCSRFToken` on the `Session` table. All the data in the column will be lost.
- You are about to drop the column `handle` on the `Session` table. All the data in the column will be lost.
- You are about to drop the column `hashedSessionToken` on the `Session` table. All the data in the column will be lost.
- You are about to drop the column `privateData` on the `Session` table. All the data in the column will be lost.
- You are about to drop the column `publicData` on the `Session` table. All the data in the column will be lost.
- The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
- A unique constraint covering the columns `[token]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
- Added the required column `token` to the `Session` table without a default value. This is not possible if the table is not empty.
- Made the column `expiresAt` on table `Session` required. This step will fail if there are existing NULL values in that column.
- Made the column `userId` on table `Session` required. This step will fail if there are existing NULL values in that column.

*/
-- Step 1: Drop foreign key constraints
ALTER TABLE "Membership"
DROP CONSTRAINT IF EXISTS "Membership_userId_fkey";

ALTER TABLE "Note"
DROP CONSTRAINT IF EXISTS "Note_userId_fkey";

ALTER TABLE "NoteComment"
DROP CONSTRAINT IF EXISTS "NoteComment_userId_fkey";

ALTER TABLE "QaEvaluation"
DROP CONSTRAINT IF EXISTS "QaEvaluation_userId_fkey";

ALTER TABLE "Session"
DROP CONSTRAINT IF EXISTS "Session_userId_fkey";

ALTER TABLE "Token"
DROP CONSTRAINT IF EXISTS "Token_userId_fkey";

-- Step 2: Delete all existing sessions
-- Better Auth uses a different session format, so all old sessions are incompatible
DELETE FROM "Session";

-- Step 3: Add emailVerified column to User (before converting id)
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- Step 4: Convert User.id from INTEGER to TEXT
-- Drop primary key constraint first
ALTER TABLE "User"
DROP CONSTRAINT "User_pkey";

-- Drop default and sequence
ALTER TABLE "User"
ALTER COLUMN "id"
DROP DEFAULT;

DROP SEQUENCE IF EXISTS "User_id_seq";

-- Convert id to TEXT using USING clause (PostgreSQL converts integer to text)
ALTER TABLE "User"
ALTER COLUMN "id"
SET DATA TYPE TEXT USING "id"::TEXT;

-- Add primary key back
ALTER TABLE "User"
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- Step 5: Convert all foreign key columns to TEXT
-- PostgreSQL will automatically handle the conversion since User.id is now TEXT
ALTER TABLE "Membership"
ALTER COLUMN "userId"
SET DATA TYPE TEXT USING "userId"::TEXT;

ALTER TABLE "Note"
ALTER COLUMN "userId"
SET DATA TYPE TEXT USING "userId"::TEXT;

ALTER TABLE "NoteComment"
ALTER COLUMN "userId"
SET DATA TYPE TEXT USING "userId"::TEXT;

ALTER TABLE "QaEvaluation"
ALTER COLUMN "userId"
SET DATA TYPE TEXT USING CASE
  WHEN "userId" IS NULL THEN NULL
  ELSE "userId"::TEXT
END;

ALTER TABLE "Token"
ALTER COLUMN "userId"
SET DATA TYPE TEXT USING "userId"::TEXT;

-- Step 8: Handle Session table
-- Drop old index
DROP INDEX IF EXISTS "Session_handle_key";

-- Add new columns first (nullable)
ALTER TABLE "Session"
ADD COLUMN "ipAddress" TEXT,
ADD COLUMN "token" TEXT,
ADD COLUMN "userAgent" TEXT;

-- Generate tokens for existing sessions (using a simple approach)
-- In production, you'd want proper session token generation
UPDATE "Session"
SET
  "token" = 'session_' || "id"::TEXT || '_' || EXTRACT(
    EPOCH
    FROM
      NOW()
  )::TEXT || '_' || MD5(RANDOM()::TEXT)
WHERE
  "token" IS NULL;

-- Convert Session.id to TEXT
ALTER TABLE "Session"
DROP CONSTRAINT "Session_pkey";

ALTER TABLE "Session"
ALTER COLUMN "id"
DROP DEFAULT;

ALTER TABLE "Session"
ALTER COLUMN "id"
SET DATA TYPE TEXT USING "id"::TEXT;

-- Convert Session.userId to TEXT (already done in Step 5, but ensure it's done)
ALTER TABLE "Session"
ALTER COLUMN "userId"
SET DATA TYPE TEXT USING "userId"::TEXT;

-- Now make required columns NOT NULL
ALTER TABLE "Session"
ALTER COLUMN "token"
SET NOT NULL;

ALTER TABLE "Session"
ALTER COLUMN "expiresAt"
SET NOT NULL;

ALTER TABLE "Session"
ALTER COLUMN "userId"
SET NOT NULL;

-- Drop old columns
ALTER TABLE "Session"
DROP COLUMN "antiCSRFToken",
DROP COLUMN "handle",
DROP COLUMN "hashedSessionToken",
DROP COLUMN "privateData",
DROP COLUMN "publicData";

-- Add primary key back
ALTER TABLE "Session"
ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");

DROP SEQUENCE IF EXISTS "Session_id_seq";

-- AlterTable
ALTER TABLE "_RegionToUpload"
ADD CONSTRAINT "_RegionToUpload_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_RegionToUpload_AB_unique";

-- CreateTable
CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT,
  CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account" ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account" ("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_identifier_value_key" ON "Verification" ("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session" ("token");

-- AddForeignKey
ALTER TABLE "Session"
ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account"
ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification"
ADD CONSTRAINT "Verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token"
ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership"
ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note"
ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteComment"
ADD CONSTRAINT "NoteComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaEvaluation"
ADD CONSTRAINT "QaEvaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
