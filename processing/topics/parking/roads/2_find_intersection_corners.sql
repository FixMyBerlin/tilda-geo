DO $$ BEGIN RAISE NOTICE 'START calculating intersection corners at %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _parking_intersection_corners;

-- for each road intersection where the roads incide with an angle smaller than 140 degrees
-- find the intersection points of the kerbs
SELECT
  ROW_NUMBER() OVER (
    ORDER BY
      i.node_id,
      corner.kerb1_id,
      corner.kerb2_id
  ) as id,
  i.node_id as intersection_id,
  i.road_degree,
  i.driveway_degree,
  i.total_degree,
  corner.kerb1_id,
  corner.kerb2_id,
  corner.has_driveway,
  corner.has_road,
  corner.intersection as geom
  --
  INTO _parking_intersection_corners
FROM
  _parking_intersections as i
  CROSS JOIN LATERAL get_intersection_corners (i.node_id, 140) AS corner
WHERE
  i.total_degree > 2;

-- CLEANUP
ALTER TABLE _parking_intersection_corners
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
