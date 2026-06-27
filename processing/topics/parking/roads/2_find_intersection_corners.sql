-- WHAT IT DOES:
-- Find intersection corners where kerbs meet (for roads with angle < 140 degrees).
-- * Set-based rewrite of the former per-row `tilda_get_intersection_corners` + `tilda_intersection_angle`
--   PL/pgSQL functions. The old version called one PL/pgSQL function per intersection via
--   `CROSS JOIN LATERAL`, and that function called another PL/pgSQL function once per road pair.
--   With hundreds of thousands of intersections this meant millions of function invocations,
--   each planned and executed on its own. This rewrite expresses the same logic as a few large
--   set operations so the planner can use hash/merge joins and a single spatial pass.
-- * Uses all rows from `_parking_intersections`; that table is already filtered when created in `1_find_intersections.sql`
-- INPUT: `_parking_intersections` (point), `_parking_node_road_mapping`, `_parking_roads`, kerbs from `_parking_kerbs`
-- OUTPUT: `_parking_intersection_corners` (point)
--
-- LOGIC (ported 1:1 from the removed functions):
-- 1. `road_segments` – for every road that passes through an intersection node, compute the azimuth
--    of its end segment at that node. `idx_next = idx + 1` when the node is the first node of the way,
--    otherwise `idx - 1` (port of `tilda_intersection_angle.end_segments`/`azimuths`). A way can pass
--    through the same node more than once (loops); each occurrence is its own `idx` row.
-- 2. `road_pairs` – for every distinct pair of ways at a node (`way_id1 < way_id2`) compute the
--    smallest angle. For loops there are multiple segment combinations per pair; we take the `MIN`
--    over all of them (port of `tilda_intersection_angle.intersection_angles` + final `MIN`).
--    `ST_Azimuth` returns NULL for coincident points; `MIN` ignores those NULL angles, matching the
--    old behavior. We keep only sharp pairs (`degrees(angle) < 140`).
-- 3. `kerb_pairs` – join the surviving pairs to the kerbs of each way and intersect them
--    (port of `tilda_get_intersection_corners.kerb_pairs`). `kerb1` always comes from the lower
--    `way_id`, `kerb2` from the higher one, so the `(kerb1_id, kerb2_id)` ordering (and therefore the
--    output `id`) is identical to the function-based version.
-- 4. Output only non-empty single `POINT` intersections, joined back to `_parking_intersections` for
--    the intersection metadata.
--
-- TODO (carried over from the former `intersection_angle.sql`, behavior preserved): sometimes we miss
-- intersection corners because the roads are split close to the intersection, see:
-- https://viewer.tilda-geo.de/?map=19.2/52.47141/13.34039&search=parking&source=Staging&layers=parking_intersection_corners,parking_intersections,_parking_roads
--
-- NOTE: the final `ORDER BY id` pins the physical row order. It does not change the row set, but it
-- makes the table's order deterministic and stable across runs/planner changes (downstream code such
-- as `5_trim_kerbs.sql` no longer depends on physical corner order, but a stable order keeps the
-- whole pipeline reproducible regardless).
--
DO $$ BEGIN RAISE NOTICE 'START calculating intersection corners at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_intersection_corners;

-- Find kerb intersection points for each road intersection.
-- But only for roads that meet at angle < 140 degrees (sharp corners where kerbs actually intersect).
CREATE TABLE _parking_intersection_corners AS
WITH
  -- (1) Azimuth of each road's end segment at every intersection node it passes through.
  -- Restricted to intersection nodes via the join to `_parking_intersections` (keeps this cheap).
  road_segments AS (
    SELECT
      nrm.node_id,
      nrm.way_id,
      ST_Azimuth (
        ST_PointN (r.geom, nrm.idx),
        ST_PointN (
          r.geom,
          CASE
            WHEN nrm.idx = 1 THEN nrm.idx + 1
            ELSE nrm.idx - 1
          END
        )
      ) AS azimuth
    FROM
      _parking_node_road_mapping nrm
      JOIN _parking_intersections i ON i.node_id = nrm.node_id
      JOIN _parking_roads r ON r.osm_id = nrm.way_id
  ),
  -- (2) Smallest angle per distinct way pair at a node.
  -- `MIN` over the loop/segment combinations and over NULL azimuths reproduces the old `MIN` semantics.
  road_pairs AS (
    SELECT
      s1.node_id,
      s1.way_id AS way_id1,
      s2.way_id AS way_id2,
      MIN(
        CASE
          WHEN abs(s1.azimuth - s2.azimuth) > pi() THEN 2 * pi() - abs(s1.azimuth - s2.azimuth)
          ELSE abs(s1.azimuth - s2.azimuth)
        END
      ) AS angle
    FROM
      road_segments s1
      JOIN road_segments s2 ON s1.node_id = s2.node_id
      AND s1.way_id < s2.way_id -- ordered pairs (A,B) with A < B; excludes self-pairs and duplicates
    GROUP BY
      s1.node_id,
      s1.way_id,
      s2.way_id
  ),
  -- Keep only sharp corners (< 140 degrees) before the expensive kerb spatial join.
  -- `degrees(NULL) < 140` is NULL (not kept), matching the old `WHERE degrees(angle) < max_angle_degrees`.
  sharp_pairs AS (
    SELECT
      *
    FROM
      road_pairs
    WHERE
      degrees(angle) < 140
  ),
  -- (3) Intersect the kerbs of each sharp way pair. `kerb1` = lower way_id, `kerb2` = higher way_id.
  kerb_pairs AS (
    SELECT
      rp.node_id,
      ST_Intersection (kerb1.geom, kerb2.geom) AS geom,
      kerb1.is_driveway OR kerb2.is_driveway AS has_driveway,
      kerb1.is_parking_road OR kerb2.is_parking_road AS has_parking_road,
      kerb1.id AS kerb1_id,
      kerb2.id AS kerb2_id
    FROM
      sharp_pairs rp
      JOIN _parking_kerbs kerb1 ON kerb1.osm_id = rp.way_id1
      JOIN _parking_kerbs kerb2 ON kerb2.osm_id = rp.way_id2
    WHERE
      kerb1.geom && kerb2.geom
      AND ST_Intersects (kerb1.geom, kerb2.geom)
  )
SELECT
  i.id || '-' || corner.kerb1_id || '-' || corner.kerb2_id AS id,
  i.node_id as intersection_id,
  i.road_degree,
  i.driveway_degree,
  i.total_degree,
  corner.kerb1_id,
  corner.kerb2_id,
  corner.has_driveway,
  corner.has_parking_road,
  corner.geom as geom
FROM
  kerb_pairs AS corner
  JOIN _parking_intersections AS i ON i.node_id = corner.node_id
WHERE
  NOT ST_IsEmpty (corner.geom)
  AND GeometryType (corner.geom) = 'POINT'
ORDER BY
  id;

DO $$ BEGIN RAISE NOTICE 'END calculating intersection corners at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

ALTER TABLE _parking_intersection_corners
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

DROP INDEX IF EXISTS parking_intersection_corners_id_idx;

CREATE UNIQUE INDEX parking_intersection_corners_id_idx ON _parking_intersection_corners (id);
