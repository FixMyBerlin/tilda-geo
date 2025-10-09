DO $$ BEGIN RAISE NOTICE 'START trimming kerbs at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

WITH
  flat_kerbs AS (
    SELECT
      c.intersection_id,
      c.geom AS corner_geom,
      kerbs.kerb_id
    FROM
      _parking_intersection_corners c,
      LATERAL (
        VALUES
          (c.kerb1_id),
          (c.kerb2_id)
      ) AS kerbs (kerb_id)
    WHERE
      c.has_driveway
      AND c.has_road
  )
UPDATE _parking_kerbs k
SET
  geom = trim_kerb_at_corner (fk.intersection_id, fk.corner_geom, k.id)
FROM
  flat_kerbs fk
WHERE
  k.id = fk.kerb_id
  AND k.is_driveway
  AND GeometryType (k.geom) = 'LINESTRING';
