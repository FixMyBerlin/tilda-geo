-- WHAT IT DOES:
-- Trim (shorten) driveway-leg kerbs at intersection corners where they meet road kerbs.
-- * Problem: When kerbs are created by offsetting road centerlines, driveway kerbs extend the full length of the driveway,
--   including beyond intersection corners into the road area.
-- * Only the "driveway leg" at each corner is trimmed (same rule as driveway cutouts in 3_find_driveways): pure driveways always; parking_road kerbs only when that node has parking_road_as_driveway_leg (e.g. service+parking meeting residential). Do not trim the parking-road kerb when it is the main road at that node (e.g. service+parking meeting pure driveway).
-- * Cut the driveway-leg kerb exactly at the intersection point where it meets the road kerb.
-- * DETERMINISM: a single kerb can be a driveway-leg at more than one corner (e.g. a service road
--   that meets the network at both ends, or pairs with several road kerbs at one node). The trim
--   applies exactly ONE cut per kerb. Previously this was an `UPDATE ... FROM` where the kerb joined
--   multiple corner rows, so Postgres applied an arbitrary one of them, chosen by the physical row
--   order of `_parking_intersection_corners`. That made the result depend on how that table happened
--   to be ordered. We now pick the corner deterministically with `DISTINCT ON (kerb_id) ORDER BY
--   kerb_id, corner_id`, so the trim is stable and independent of corner row order (one cut per kerb,
--   same as before — only the tie-break is now defined instead of arbitrary).
-- EXAMPLE: https://viewer.tilda-geo.de/?map=19.3/52.4793217/13.4435624&source=Staging&search=_kerb&layers=_parking_intersection_corners,_parking_kerbs
-- INPUT: `_parking_intersection_corners` (point), `_parking_intersections` (for parking_road_as_driveway_leg), `_parking_kerbs` (linestring)
-- OUTPUT: `_parking_kerbs` (updated - driveway-leg kerbs shortened at intersection corners)
--
DO $$ BEGIN RAISE NOTICE 'START trimming kerbs at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

WITH
  flat_kerbs AS (
    SELECT
      c.id AS corner_id,
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
  ),
  -- Among all corners that would trim a given driveway-leg kerb, deterministically pick exactly one.
  -- The filter (is_driveway / LINESTRING / parking-road rule) decides which kerbs are eligible and is
  -- applied here so the `DISTINCT ON` only chooses between corners that would actually trim the kerb.
  trim_corner AS (
    SELECT DISTINCT
      ON (fk.kerb_id) fk.kerb_id,
      fk.intersection_id,
      fk.corner_geom
    FROM
      flat_kerbs fk
      JOIN _parking_kerbs k ON k.id = fk.kerb_id
    WHERE
      k.is_driveway
      AND GeometryType (k.geom) = 'LINESTRING'
      AND (
        (k.is_parking_road = false)
        OR fk.parking_road_as_driveway_leg
      )
    ORDER BY
      fk.kerb_id,
      fk.corner_id
  )
UPDATE _parking_kerbs k
SET
  geom = tilda_trim_kerb_at_corner (tc.intersection_id, tc.corner_geom, k.id)
FROM
  trim_corner tc
WHERE
  k.id = tc.kerb_id;

DO $$ BEGIN RAISE NOTICE 'END trimming kerbs at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
