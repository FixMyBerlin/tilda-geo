-- WHAT IT DOES:
-- Find road intersections (nodes where multiple roads meet).
-- * Calculate road_degree (non-driveway roads) and driveway_degree (driveway roads)
-- * Filter: only intersections with total_degree > 2 (excludes simple road splits, keeps real intersections)
-- INPUT: `_parking_node_road_mapping`, `_parking_roads` (linestring)
-- OUTPUT: `_parking_intersections` (point)
--
DO $$ BEGIN RAISE NOTICE 'START finding intersections at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_intersections;

-- CREATE intersections table
-- We define intersections as nodes where multiple roads meet:
-- * T-intersections: 2 roads where one goes through (doesn't end at node) and one is split (ends at node)
-- * X-intersections: >2 roads meeting at node (all roads end at node)
-- * Through-intersections: roads that go through node (don't end at node) count as multiple connections
--
-- Degree calculation:
-- * `road_degree`: number of non-driveway road connections (roads that end at node count as 1, roads that go through count as 2)
-- * `driveway_degree`: number of driveway road connections (same counting logic)
-- Used for:
-- - filtering intersections (total_degree > 2)
-- - identifying driveway intersections (used in `3_find_driveways.sql`)
--
-- Filter: total_degree > 2
-- We filter to exclude cases where a road was just split (not actually an intersection).
-- * Simple 2-way road endpoints: both roads end at node (degree = 1 + 1 = 2) - excluded (just a road split, not an intersection)
-- * T-intersections: one road goes through, one ends (degree = 2 + 1 = 3) - included
-- * X-intersections: >2 roads meet (degree >= 3) - included
-- * Through-intersections: roads that go through node (degree >= 4 for 2 roads, higher for more) - included
-- We only want real intersections where parking behavior changes (T-intersections, X-intersections, through-intersections).
CREATE TABLE _parking_intersections AS
WITH
  intersections AS (
    SELECT
      nrm.node_id,
      SUM(
        (NOT is_driveway)::INT + (
          NOT is_terminal_node
          AND NOT is_driveway
        )::INT
      ) AS road_degree,
      SUM(
        is_driveway::INT + (
          NOT is_terminal_node
          AND is_driveway
        )::INT
      ) AS driveway_degree,
      (
        array_agg(
          nrm.way_id
          ORDER BY
            nrm.way_id,
            nrm.idx
        )
      ) [1] AS way_id,
      (
        array_agg(
          nrm.idx
          ORDER BY
            nrm.way_id,
            nrm.idx
        )
      ) [1] AS idx
    FROM
      _parking_node_road_mapping nrm
    GROUP BY
      nrm.node_id
    HAVING
      COUNT(nrm.way_id) > 1
  )
SELECT
  'node/' || i.node_id::TEXT as id,
  i.node_id,
  i.road_degree,
  i.driveway_degree,
  i.road_degree + i.driveway_degree AS total_degree,
  ST_PointN (road.geom, nrm.idx) AS geom
FROM
  intersections i
  JOIN _parking_node_road_mapping nrm ON i.way_id = nrm.way_id
  AND i.node_id = nrm.node_id
  AND i.idx = nrm.idx
  JOIN _parking_roads road ON road.osm_id = nrm.way_id
WHERE
  i.road_degree + i.driveway_degree > 2;

-- MISC
ALTER TABLE _parking_intersections
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_intersections_geom_idx ON _parking_intersections USING GIST (geom);

CREATE INDEX parking_intersections_node_id_idx ON _parking_intersections USING BTREE (node_id);
