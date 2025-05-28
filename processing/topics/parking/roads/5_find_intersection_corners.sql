-- PREPARE
DROP TABLE IF EXISTS _parking_intersection_corners;

-- for each road intersection where the roads incide with an angle smaller than 140 degrees
-- find the intersection points of the kerbs
SELECT
  i.node_id as intersection_id,
  i.road_degree,
  i.driveway_degree,
  i.total_degree,
  corners as geom
  --
  INTO _parking_intersection_corners
FROM
  _parking_intersections as i
  CROSS JOIN LATERAL find_intersection_corners (i.node_id, 140) AS corners
WHERE
  i.road_degree > 2;

-- CLEANUP
ALTER TABLE _parking_intersection_corners
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

DO $$
BEGIN
  RAISE NOTICE 'Finished calculating intersection corners at %', clock_timestamp();
END
$$;
