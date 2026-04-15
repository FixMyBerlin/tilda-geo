-- Backfill missing OSM account links for existing users.
-- Better Auth expects Account(providerId='osm', accountId=osmId::text) to exist.
INSERT INTO
  "Account" (
    "id",
    "accountId",
    "providerId",
    "userId",
    "createdAt",
    "updatedAt"
  )
SELECT
  'backfill-osm-' || u."id",
  u."osmId"::TEXT,
  'osm',
  u."id",
  NOW(),
  NOW()
FROM
  "User" u
WHERE
  u."osmId" IS NOT NULL
  AND NOT EXISTS (
    SELECT
      1
    FROM
      "Account" a
    WHERE
      a."providerId" = 'osm'
      AND a."accountId" = u."osmId"::TEXT
  );
