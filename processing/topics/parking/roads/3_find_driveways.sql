-- WHAT IT DOES:
-- Create new 10m segment geometries for driveways that connect to intersections.
-- * Find driveways connected to intersections (where driveway_degree > 0 and road_degree > 1)
-- * Create new 10m segment geometry directly:
--   * Start point: intersection point
--   * End point: 10m projected from intersection in driveway direction (ST_Project with azimuth)
--   * Direction: calculated from intersection point to next point along driveway (ST_Azimuth)
-- INPUT: `_parking_roads` (linestring), `_parking_node_road_mapping`, `_parking_intersections` (point)
-- OUTPUT: `_parking_driveways` (linestring)
--
DO $$ BEGIN RAISE NOTICE 'START finding driveways at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_driveways;

CREATE TABLE _parking_driveways AS
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
  nrm.idx
FROM
  _parking_roads r
  JOIN _parking_node_road_mapping nrm ON r.osm_id = nrm.way_id
  JOIN _parking_intersections i ON nrm.node_id = i.node_id
WHERE
  i.driveway_degree > 0
  AND i.road_degree > 1
  AND r.is_driveway;

-- MISC
ALTER TABLE _parking_driveways
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
