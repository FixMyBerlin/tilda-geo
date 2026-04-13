-- Backfill null emails for existing users (Better Auth requires non-empty email)
UPDATE "User"
SET "email" = 'osm-' || "osmId"::TEXT || '@users.openstreetmap.invalid'
WHERE "email" IS NULL;

-- Make email required
ALTER TABLE "User"
ALTER COLUMN "email" SET NOT NULL;
