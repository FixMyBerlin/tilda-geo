-- Remove hashedPassword field from User table
-- This field is not needed since we only use OAuth authentication (no email/password)

ALTER TABLE "User" DROP COLUMN IF EXISTS "hashedPassword";
