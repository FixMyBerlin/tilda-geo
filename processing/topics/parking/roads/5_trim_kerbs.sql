-- WHAT IT DOES:
-- Trim (shorten) driveway kerbs at intersection corners where they meet road kerbs.
-- * Problem: When kerbs are created by offsetting road centerlines, driveway kerbs extend the full length of the driveway,
--   including beyond intersection corners into the road area.
-- * Solution: Cut driveway kerbs exactly at the intersection point where driveway kerb intersects road kerb.
--   Remove the overlapping part of the driveway kerb.
-- * Only trim driveway kerbs (not regular road kerbs) because driveways end at intersections, roads continue through
-- EXAMPLE: https://viewer.tilda-geo.de/?map=19.3/52.4793217/13.4435624&source=Staging&search=_kerb&layers=_parking_intersection_corners,_parking_kerbs
-- INPUT: `_parking_intersection_corners` (point), `_parking_kerbs` (linestring)
-- OUTPUT: `_parking_kerbs` (updated - driveway kerbs shortened at intersection corners)
--
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
  geom = tilda_trim_kerb_at_corner (fk.intersection_id, fk.corner_geom, k.id)
FROM
  flat_kerbs fk
WHERE
  k.id = fk.kerb_id
  AND k.is_driveway
  AND GeometryType (k.geom) = 'LINESTRING';
