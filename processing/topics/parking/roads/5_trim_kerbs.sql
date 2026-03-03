-- WHAT IT DOES:
-- Trim (shorten) driveway-leg kerbs at intersection corners where they meet road kerbs.
-- * Problem: When kerbs are created by offsetting road centerlines, driveway kerbs extend the full length of the driveway,
--   including beyond intersection corners into the road area.
-- * Only the "driveway leg" at each corner is trimmed (same rule as driveway cutouts in 3_find_driveways): pure driveways always; parking_road kerbs only when that node has parking_road_as_driveway_leg (e.g. service+parking meeting residential). Do not trim the parking-road kerb when it is the main road at that node (e.g. service+parking meeting pure driveway).
-- * Cut the driveway-leg kerb exactly at the intersection point where it meets the road kerb.
-- EXAMPLE: https://viewer.tilda-geo.de/?map=19.3/52.4793217/13.4435624&source=Staging&search=_kerb&layers=_parking_intersection_corners,_parking_kerbs
-- INPUT: `_parking_intersection_corners` (point), `_parking_intersections` (for parking_road_as_driveway_leg), `_parking_kerbs` (linestring)
-- OUTPUT: `_parking_kerbs` (updated - driveway-leg kerbs shortened at intersection corners)
--
DO $$ BEGIN RAISE NOTICE 'START trimming kerbs at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

WITH
  flat_kerbs AS (
    SELECT
      c.intersection_id,
      c.geom AS corner_geom,
      kerbs.kerb_id,
      i.parking_road_as_driveway_leg
    FROM
      _parking_intersection_corners c
      JOIN _parking_intersections i ON i.node_id = c.intersection_id,
      LATERAL (
        VALUES
          (c.kerb1_id),
          (c.kerb2_id)
      ) AS kerbs (kerb_id)
    WHERE
      c.has_driveway
      AND c.has_parking_road
  )
UPDATE _parking_kerbs k
SET
  geom = tilda_trim_kerb_at_corner (fk.intersection_id, fk.corner_geom, k.id)
FROM
  flat_kerbs fk
WHERE
  k.id = fk.kerb_id
  AND k.is_driveway
  AND GeometryType (k.geom) = 'LINESTRING'
  AND (
    (k.is_parking_road = false)
    OR fk.parking_road_as_driveway_leg
  );

DO $$ BEGIN RAISE NOTICE 'END trimming kerbs at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
