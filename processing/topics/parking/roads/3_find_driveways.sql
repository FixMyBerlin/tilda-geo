-- WHAT IT DOES:
-- Create new 10m segment geometries for driveway legs that connect to intersections.
-- * Candidate segments: driveways at nodes with driveway_degree > 0 and road_degree >= 1. Single predicate is_driveway_leg_at_node (see driveway_legs subquery below) selects which segment gets a cutout: pure driveways always; service+parking only when it is the sole driveway leg at the node (e.g. meeting residential).
-- * Geometry: 10m segment from intersection point, direction from ST_Azimuth to next vertex.
-- INPUT: `_parking_roads` (linestring), `_parking_node_road_mapping`, `_parking_intersections` (point)
-- OUTPUT: `_parking_driveways` (linestring)
--
DO $$ BEGIN RAISE NOTICE 'START finding driveways at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_driveways;

CREATE TABLE _parking_driveways AS
WITH
  driveway_legs AS (
    SELECT
      r.id || '-' || nrm.idx AS id,
      r.id AS source_id,
      r.osm_id,
      r.osm_type,
      r.tags,
      r.meta,
      ST_MakeLine (
        ST_PointN (r.geom, nrm.idx),
        ST_Project (
          ST_PointN (r.geom, nrm.idx),
          10,
          ST_Azimuth (
            ST_PointN (r.geom, nrm.idx),
            COALESCE(
              ST_PointN (r.geom, nrm.idx + 1),
              ST_PointN (r.geom, nrm.idx - 1)
            )
          )
        )
      ) AS geom,
      r.is_driveway,
      r.has_parking,
      nrm.idx,
      (
        r.is_driveway
        AND (
          (r.is_parking_road = false)
          OR i.parking_road_as_driveway_leg
        )
      ) AS is_driveway_leg_at_node
    FROM
      _parking_roads r
      JOIN _parking_node_road_mapping nrm ON r.osm_id = nrm.way_id
      JOIN _parking_intersections i ON nrm.node_id = i.node_id
    WHERE
      i.driveway_degree > 0
      AND i.road_degree >= 1
      AND r.is_driveway
  )
SELECT
  id,
  source_id,
  osm_id,
  osm_type,
  tags,
  meta,
  geom,
  is_driveway,
  has_parking,
  idx
FROM
  driveway_legs
WHERE
  is_driveway_leg_at_node;

-- MISC
ALTER TABLE _parking_driveways
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

DO $$ BEGIN RAISE NOTICE 'END finding driveways at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
