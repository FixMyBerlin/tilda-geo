-- WHAT IT DOES:
-- Find road intersections (nodes where multiple roads meet).
-- * Calculate total_degree (raw connection count), road_degree (segments with is_parking_road true), driveway_degree (driveway segments)
-- * Filter: total_degree > 2 (real intersections) OR total_degree >= 2 with road_degree >= 1 and driveway_degree >= 1 (2-way parking_road + driveway, e.g. service+parking meets service+driveway)
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
-- * `total_degree`: raw connection count per segment (1 if terminal, 2 if through)
-- * `road_degree`: segments where is_parking_road is true (same weight); used so 2-way service+parking / service+driveway nodes get cutouts
-- * `driveway_degree`: segments where is_driveway is true (same weight)
-- Used for: filtering intersections; identifying driveway intersections (used in `3_find_driveways.sql`)
--
-- We filter to exclude cases where a road was just split (not actually an intersection).
-- * Simple 2-way road endpoints: both roads end at node (degree = 1 + 1 = 2) - excluded (just a road split, not an intersection)
-- * T-intersections: one road goes through, one ends (degree = 2 + 1 = 3) - included
-- * X-intersections: >2 roads meet (degree >= 3) - included
-- * Through-intersections: roads that go through node (degree >= 4 for 2 roads, higher for more) - included
-- Additionally: 2-way nodes with total_degree = 2 are included when road_degree >= 1 AND driveway_degree >= 1 (e.g. service+parking meets service+driveway).
--
-- Filter: (total_degree > 2) OR (total_degree >= 2 AND road_degree >= 1 AND driveway_degree >= 1)
CREATE TABLE _parking_intersections AS
WITH
  intersections AS (
    SELECT
      nrm.node_id,
      SUM(1 + (NOT nrm.is_terminal_node)::INT) AS total_degree,
      SUM(
        (1 + (NOT nrm.is_terminal_node)::INT) * nrm.is_parking_road::INT
      ) AS road_degree,
      SUM(
        (1 + (NOT nrm.is_terminal_node)::INT) * nrm.is_driveway::INT
      ) AS driveway_degree,
      BOOL_OR(nrm.is_driveway AND (nrm.is_parking_road = false)) AS has_pure_driveway,
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
  i.total_degree,
  i.has_pure_driveway,
  ST_PointN (road.geom, nrm.idx) AS geom
FROM
  intersections i
  JOIN _parking_node_road_mapping nrm ON i.way_id = nrm.way_id
  AND i.node_id = nrm.node_id
  AND i.idx = nrm.idx
  JOIN _parking_roads road ON road.osm_id = nrm.way_id
WHERE
  (i.total_degree > 2)
  OR (
    i.total_degree >= 2
    AND i.road_degree >= 1
    AND i.driveway_degree >= 1
  );

-- MISC
ALTER TABLE _parking_intersections
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_intersections_geom_idx ON _parking_intersections USING GIST (geom);

CREATE INDEX parking_intersections_node_id_idx ON _parking_intersections USING BTREE (node_id);
