-- WHAT IT DOES:
-- Find intersection corners where kerbs meet (for roads with angle < 140 degrees).
-- * Use `get_intersection_corners` to find kerb intersection points
-- * Filter: only intersections with total_degree > 2 (same as `1_find_intersections.sql`)
-- INPUT: `_parking_intersections` (point), kerbs from `_parking_kerbs`
-- OUTPUT: `_parking_intersection_corners` (point)
--
DO $$ BEGIN RAISE NOTICE 'START calculating intersection corners at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_intersection_corners;

-- Find kerb intersection points for each road intersection.
-- But only for roads that meet at angle < 140 degrees (sharp corners where kerbs actually intersect).
CREATE TABLE _parking_intersection_corners AS
SELECT
  i.id || '-' || corner.kerb1_id || '-' || corner.kerb2_id AS id,
  i.node_id as intersection_id,
  i.road_degree,
  i.driveway_degree,
  i.total_degree,
  corner.kerb1_id,
  corner.kerb2_id,
  corner.has_driveway,
  corner.has_road,
  corner.intersection as geom
FROM
  _parking_intersections as i
  CROSS JOIN LATERAL get_intersection_corners (i.node_id, 140) AS corner
WHERE
  i.total_degree > 2;

ALTER TABLE _parking_intersection_corners
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

DROP INDEX IF EXISTS parking_intersection_corners_id_idx;

CREATE UNIQUE INDEX parking_intersection_corners_id_idx ON _parking_intersection_corners (id);
