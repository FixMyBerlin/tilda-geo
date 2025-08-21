DO $$ BEGIN RAISE NOTICE 'START calculating intersection corners at %', clock_timestamp(); END $$;

-- Step 1: Create temp table with all intersection corners (including duplicates)
-- For each road intersection where the roads incide with an angle smaller than 140 degrees
-- find the intersection points of the kerbs.
-- This will create duplicates for circular and self-referencing roads, for example:
-- - https://www.openstreetmap.org/way/24291563
-- - https://www.openstreetmap.org/way/152258384
-- - https://www.openstreetmap.org/way/1266589051
CREATE TEMP TABLE temp_intersection_corners AS
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

CREATE INDEX temp_intersection_corners_id_idx ON temp_intersection_corners (id);

-- Step 2: Insert unique rows into the final table
DROP TABLE IF EXISTS _parking_intersection_corners;

SELECT DISTINCT
  ON (id) id,
  intersection_id,
  road_degree,
  driveway_degree,
  total_degree,
  kerb1_id,
  kerb2_id,
  has_driveway,
  has_road,
  geom
  --
  INTO _parking_intersection_corners
FROM
  temp_intersection_corners
ORDER BY
  id,
  ctid;

-- CLEANUP
ALTER TABLE _parking_intersection_corners
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE UNIQUE INDEX parking_intersection_corners_id_idx ON _parking_intersection_corners (id);
