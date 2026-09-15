-- WHAT IT DOES:
-- Build zoomed-out on-street parking edges (`parkings_edges`) from the parking-road node graph.
-- * Network: every OSM way that gets on-street parking lines (`has_parking` from
--   `parkings/helper/has_parking.lua`, same gate as `_parking_road_parkings`). That includes
--   `is_road` streets and driveways/service with explicit `parking:*` tags. `motorway_link` /
--   `pedestrian` only when tagged. Separate `street_side` areas still attach to those kerbs.
-- * Merge each chain with ST_LineMerge+ST_Dump (same pattern as `4_merge_parkings.sql`)
-- * Orient to the longest constituent way's OSM direction; attach on-street capacity per side
--   from `parkings` that overlap that edge's clipped kerb (not smeared by OSM-way length).
--   `capacity_*` is public; `capacity_private_*` is private when present. Per kerb, more *rounded*
--   capacity wins (tie → public); `operator_type_*` and paint tags use that subset and are omitted at 0.
-- * Does not spatially split ways; cuts only at node indexes from `_parking_node_road_mapping`
-- * On-street parking lines (`parkings`) are tiled from z14; this table is the zoomed-out view
-- INPUT: `_parking_node_road_mapping`, `_parking_roads` (linestring 5243), `_parking_kerbs`, `parkings`
-- OUTPUT: `parkings_edges` (linestring, 3857)
-- Intermediates (`_parking_edges_*`) are TEMP. Only this script reads them.
--
-- minzoom by length (meters in 5243): <50 → 13, else 0
-- Mid/long edges stay on the map when zooming out; style collapses left/right to a flush centerline.
--
DO $$ BEGIN RAISE NOTICE 'START creating parking edges at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- 1. Clear the osm2pgsql table (do not DROP, that table is the tile source).
-- Skip the rest of the graph when `parkings` is empty so a parking-less extract stays a no-op.
DELETE FROM parkings_edges;

DROP TABLE IF EXISTS _parking_edges_has_parkings;

CREATE TEMP TABLE _parking_edges_has_parkings AS
SELECT
  EXISTS (
    SELECT
      1
    FROM
      parkings
  ) AS present;

-- 2. Network: same `has_parking` as `_parking_road_parkings` (see `has_parking.lua`).
-- Driveways/service are included when they have explicit parking tags. Degree uses the same
-- 1-if-terminal / 2-if-through weight as `roads/1_find_intersections.sql`.
-- A node with degree <> 2 is a vertex (intersection / dead end) and will split chains.
DROP TABLE IF EXISTS _parking_edges_network;

CREATE TEMP TABLE _parking_edges_network AS
SELECT
  nrm.way_id,
  nrm.node_id,
  nrm.idx,
  nrm.is_terminal_node
FROM
  _parking_node_road_mapping nrm
WHERE
  nrm.has_parking
  AND (
    SELECT
      present
    FROM
      _parking_edges_has_parkings
  );

CREATE INDEX _parking_edges_network_way_idx_idx ON _parking_edges_network (way_id, idx);

CREATE INDEX _parking_edges_network_node_id_idx ON _parking_edges_network (node_id);

DROP TABLE IF EXISTS _parking_edges_degree;

CREATE TEMP TABLE _parking_edges_degree AS
SELECT
  node_id,
  SUM(1 + (NOT is_terminal_node)::INT) AS degree,
  (
    SUM(1 + (NOT is_terminal_node)::INT) <> 2
  ) AS is_vertex
FROM
  _parking_edges_network
GROUP BY
  node_id;

CREATE INDEX _parking_edges_degree_node_id_idx ON _parking_edges_degree (node_id);

CREATE INDEX _parking_edges_degree_non_vertex_idx ON _parking_edges_degree (node_id)
WHERE
  NOT is_vertex;

-- 3. Node and way-vertex geoms in 5243 for ST_MakeLine and later endpoint snap.
DROP TABLE IF EXISTS _parking_edges_nodes;

CREATE TEMP TABLE _parking_edges_nodes AS
SELECT DISTINCT
  ON (nrm.node_id) nrm.node_id,
  ST_PointN (r.geom, nrm.idx) AS geom
FROM
  _parking_edges_network nrm
  JOIN _parking_roads r ON r.osm_id = nrm.way_id
ORDER BY
  nrm.node_id,
  nrm.way_id,
  nrm.idx;

CREATE INDEX _parking_edges_nodes_node_id_idx ON _parking_edges_nodes (node_id);

CREATE INDEX _parking_edges_nodes_geom_idx ON _parking_edges_nodes USING GIST (geom);

DROP TABLE IF EXISTS _parking_edges_road_points;

CREATE TEMP TABLE _parking_edges_road_points AS
SELECT
  r.osm_id AS way_id,
  i AS idx,
  ST_PointN (r.geom, i) AS geom
FROM
  _parking_roads r
  JOIN (
    SELECT DISTINCT
      way_id
    FROM
      _parking_edges_network
  ) n ON r.osm_id = n.way_id
  CROSS JOIN LATERAL generate_series(1, ST_NPoints (r.geom)) AS i;

CREATE INDEX _parking_edges_road_points_way_idx_idx ON _parking_edges_road_points (way_id, idx);

-- 4. Cuts: every way endpoint, plus vertex nodes (degree <> 2).
-- Consecutive cuts on a way become segments. `chain_id` starts as the segment id.
DROP TABLE IF EXISTS _parking_edges_cuts;

CREATE TEMP TABLE _parking_edges_cuts AS
SELECT DISTINCT
  wn.way_id,
  wn.idx,
  wn.node_id
FROM
  _parking_edges_network wn
  JOIN _parking_edges_degree d ON d.node_id = wn.node_id
  JOIN (
    SELECT
      way_id,
      MIN(idx) AS idx_min,
      MAX(idx) AS idx_max
    FROM
      _parking_edges_network
    GROUP BY
      way_id
  ) r ON wn.way_id = r.way_id
WHERE
  wn.idx = r.idx_min
  OR wn.idx = r.idx_max
  OR d.is_vertex;

CREATE UNIQUE INDEX _parking_edges_cuts_way_idx_idx ON _parking_edges_cuts (way_id, idx);

-- Consecutive cuts → one segment per (idx_from, idx_to) pair on the same way.
DROP TABLE IF EXISTS _parking_edges_segment_defs;

CREATE TEMP TABLE _parking_edges_segment_defs AS
SELECT
  ROW_NUMBER() OVER (
    ORDER BY
      c.way_id,
      c.idx_from
  ) AS id,
  c.way_id,
  ROW_NUMBER() OVER (
    PARTITION BY
      c.way_id
    ORDER BY
      c.idx_from
  ) AS seq,
  c.idx_from,
  c.idx_to,
  c.from_node,
  c.to_node
FROM
  (
    SELECT
      way_id,
      idx AS idx_from,
      LEAD(idx) OVER (
        PARTITION BY
          way_id
        ORDER BY
          idx
      ) AS idx_to,
      node_id AS from_node,
      LEAD(node_id) OVER (
        PARTITION BY
          way_id
        ORDER BY
          idx
      ) AS to_node
    FROM
      _parking_edges_cuts
  ) c
WHERE
  c.idx_to IS NOT NULL
  AND c.idx_to > c.idx_from;

-- Build each segment linestring from the way's vertex points between the two cuts.
DROP TABLE IF EXISTS _parking_edges_segments;

CREATE TEMP TABLE _parking_edges_segments AS
SELECT
  d.id,
  d.way_id,
  d.seq,
  d.idx_from,
  d.idx_to,
  d.from_node,
  d.to_node,
  ST_MakeLine (
    rp.geom
    ORDER BY
      rp.idx
  ) AS geom,
  d.id AS chain_id
FROM
  _parking_edges_segment_defs d
  JOIN _parking_edges_road_points rp ON rp.way_id = d.way_id
  AND rp.idx BETWEEN d.idx_from AND d.idx_to
GROUP BY
  d.id,
  d.way_id,
  d.seq,
  d.idx_from,
  d.idx_to,
  d.from_node,
  d.to_node;

DELETE FROM _parking_edges_segments
WHERE
  geom IS NULL
  OR ST_NPoints (geom) < 2;

ALTER TABLE _parking_edges_segments
ALTER COLUMN geom TYPE geometry (LineString, 5243) USING ST_SetSRID (geom, 5243);

CREATE UNIQUE INDEX _parking_edges_segments_id_idx ON _parking_edges_segments (id);

CREATE INDEX _parking_edges_segments_from_node_idx ON _parking_edges_segments (from_node);

CREATE INDEX _parking_edges_segments_to_node_idx ON _parking_edges_segments (to_node);

CREATE INDEX _parking_edges_segments_way_id_idx ON _parking_edges_segments (way_id);

CREATE INDEX _parking_edges_segments_chain_id_idx ON _parking_edges_segments (chain_id);

ANALYZE _parking_edges_segments;

-- 5. Chain labeling: at each non-vertex node, all incident segments take the smallest chain_id.
-- Iterative updates (not a recursive CTE) so a city-sized graph stays bounded.
-- After this, one chain_id is a run of segments through degree-2 nodes.
DO $$
DECLARE
  n_updated INTEGER;
  n_iter INTEGER := 0;
  max_iter INTEGER := 10000;
  ts0 TIMESTAMPTZ := clock_timestamp();
BEGIN
  LOOP
    n_iter := n_iter + 1;
    WITH
      incident AS (
        SELECT
          id,
          chain_id,
          from_node AS node_id
        FROM
          _parking_edges_segments
        UNION ALL
        SELECT
          id,
          chain_id,
          to_node
        FROM
          _parking_edges_segments
      ),
      node_min AS (
        SELECT
          i.node_id,
          MIN(i.chain_id) AS min_chain
        FROM
          incident i
          JOIN _parking_edges_degree d ON d.node_id = i.node_id
        WHERE
          NOT d.is_vertex
        GROUP BY
          i.node_id
      ),
      seg_new AS (
        SELECT
          s.id,
          LEAST(
            s.chain_id,
            COALESCE(nf.min_chain, s.chain_id),
            COALESCE(nt.min_chain, s.chain_id)
          ) AS new_chain
        FROM
          _parking_edges_segments s
          LEFT JOIN node_min nf ON nf.node_id = s.from_node
          LEFT JOIN node_min nt ON nt.node_id = s.to_node
      )
    UPDATE _parking_edges_segments s
    SET
      chain_id = n.new_chain
    FROM
      seg_new n
    WHERE
      s.id = n.id
      AND n.new_chain < s.chain_id;
    GET DIAGNOSTICS n_updated = ROW_COUNT;
    EXIT WHEN n_updated = 0;
    IF n_iter >= max_iter THEN
      RAISE WARNING 'parking edges chain labeling hit iteration cap %', max_iter;
      EXIT;
    END IF;
  END LOOP;
  RAISE NOTICE 'parking edges chain labeling: % iteration(s), elapsed %', n_iter, clock_timestamp() - ts0;
END $$;

-- How many vertex endpoints each chain has (0 / 1 / 2 / more). Used for id snap and QA.
DROP TABLE IF EXISTS _parking_edges_chain_meta;

CREATE TEMP TABLE _parking_edges_chain_meta AS
SELECT
  n.chain_id,
  COUNT(DISTINCT n.node_id) FILTER (
    WHERE
      d.is_vertex
  ) AS n_vertices,
  MIN(n.node_id) AS min_node_id
FROM
  (
    SELECT
      chain_id,
      from_node AS node_id
    FROM
      _parking_edges_segments
    UNION
    SELECT
      chain_id,
      to_node
    FROM
      _parking_edges_segments
  ) n
  JOIN _parking_edges_degree d ON d.node_id = n.node_id
GROUP BY
  n.chain_id;

CREATE INDEX _parking_edges_chain_meta_chain_id_idx ON _parking_edges_chain_meta (chain_id);

-- NOTICE only: chains that are not a simple 0- or 2-vertex run (still emitted via dump).
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      n_vertices,
      COUNT(*) AS n_chains
    FROM
      _parking_edges_chain_meta
    WHERE
      n_vertices NOT IN (0, 2)
    GROUP BY
      n_vertices
    ORDER BY
      n_vertices
  LOOP
    RAISE NOTICE 'parking edges: % chain(s) with % vertex endpoint(s) (still emitted via ST_LineMerge+ST_Dump)', rec.n_chains, rec.n_vertices;
  END LOOP;
END $$;

-- Vertex geoms per chain (for start/end node when the chain has 1–2 vertices).
DROP TABLE IF EXISTS _parking_edges_chain_vertices;

CREATE TEMP TABLE _parking_edges_chain_vertices AS
SELECT DISTINCT
  n.chain_id,
  n.node_id,
  nd.geom
FROM
  (
    SELECT
      chain_id,
      from_node AS node_id
    FROM
      _parking_edges_segments
    UNION
    SELECT
      chain_id,
      to_node
    FROM
      _parking_edges_segments
  ) n
  JOIN _parking_edges_degree d ON d.node_id = n.node_id
  AND d.is_vertex
  JOIN _parking_edges_nodes nd ON nd.node_id = n.node_id;

CREATE INDEX _parking_edges_chain_vertices_chain_id_idx ON _parking_edges_chain_vertices (chain_id);

-- 6. Merge each chain: ST_Collect → ST_Node → ST_LineMerge → ST_Dump
-- (same pattern as `4_merge_parkings.sql`). Disconnected parts of one chain become extra dump rows.
DROP TABLE IF EXISTS _parking_edges_merged;

CREATE TEMP TABLE _parking_edges_merged AS
SELECT
  t.chain_id,
  (t.d).path AS dump_path,
  (t.d).geom AS geom
FROM
  (
    SELECT
      chain_id,
      ST_Dump (ST_LineMerge (ST_Node (ST_Collect (geom)))) AS d
    FROM
      _parking_edges_segments
    GROUP BY
      chain_id
  ) t
WHERE
  GeometryType ((t.d).geom) = 'LINESTRING'
  AND ST_NPoints ((t.d).geom) >= 2;

CREATE INDEX _parking_edges_merged_chain_id_idx ON _parking_edges_merged (chain_id);

-- Map original segments onto dumped edge parts. One dump: all segments of the chain.
-- Several dumps: assign a segment when its midpoint is within 1 m of that dump geom.
DROP TABLE IF EXISTS _parking_edges_chain_dump_count;

CREATE TEMP TABLE _parking_edges_chain_dump_count AS
SELECT
  chain_id,
  COUNT(*) AS dump_count
FROM
  _parking_edges_merged
GROUP BY
  chain_id;

DROP TABLE IF EXISTS _parking_edges_seg_on_edge;

CREATE TEMP TABLE _parking_edges_seg_on_edge AS
SELECT
  m.chain_id,
  m.dump_path,
  s.id AS segment_id,
  s.way_id,
  s.seq,
  s.idx_from,
  s.idx_to,
  s.from_node,
  s.to_node,
  s.geom
FROM
  _parking_edges_merged m
  JOIN _parking_edges_chain_dump_count dc ON dc.chain_id = m.chain_id
  JOIN _parking_edges_segments s ON s.chain_id = m.chain_id
  AND (
    dc.dump_count = 1
    OR ST_DWithin (ST_LineInterpolatePoint (s.geom, 0.5), m.geom, 1.0)
  );

CREATE INDEX _parking_edges_seg_on_edge_chain_dump_idx ON _parking_edges_seg_on_edge (chain_id, dump_path);

-- 7. Orient each dumped edge to the longest OSM way's direction; record way_ids and reversed flags.
DROP TABLE IF EXISTS _parking_edges_longest_way;

CREATE TEMP TABLE _parking_edges_longest_way AS
SELECT DISTINCT
  ON (wl.chain_id, wl.dump_path) wl.chain_id,
  wl.dump_path,
  wl.way_id,
  wl.idx_from
FROM
  (
    SELECT
      chain_id,
      dump_path,
      way_id,
      SUM(ST_Length (geom)) AS way_len,
      MIN(idx_from) AS idx_from
    FROM
      _parking_edges_seg_on_edge
    GROUP BY
      chain_id,
      dump_path,
      way_id
  ) wl
ORDER BY
  wl.chain_id,
  wl.dump_path,
  wl.way_len DESC,
  wl.way_id;

CREATE INDEX _parking_edges_longest_way_chain_dump_idx ON _parking_edges_longest_way (chain_id, dump_path);

DROP TABLE IF EXISTS _parking_edges_oriented;

CREATE TEMP TABLE _parking_edges_oriented AS
SELECT
  m.chain_id,
  m.dump_path,
  CASE
    WHEN ls.geom IS NOT NULL
    AND ST_LineLocatePoint (m.geom, ST_StartPoint (ls.geom)) > ST_LineLocatePoint (m.geom, ST_EndPoint (ls.geom)) THEN ST_Reverse (m.geom)
    ELSE m.geom
  END AS geom,
  lw.way_id AS longest_way_id
FROM
  _parking_edges_merged m
  LEFT JOIN _parking_edges_longest_way lw ON lw.chain_id = m.chain_id
  AND lw.dump_path = m.dump_path
  LEFT JOIN _parking_edges_seg_on_edge ls ON ls.chain_id = lw.chain_id
  AND ls.dump_path = lw.dump_path
  AND ls.way_id = lw.way_id
  AND ls.idx_from = lw.idx_from;

CREATE INDEX _parking_edges_oriented_chain_dump_idx ON _parking_edges_oriented (chain_id, dump_path);

-- way_ids along the edge; `way_reversed` is true when that OSM way runs against the edge direction.
DROP TABLE IF EXISTS _parking_edges_way_attrs;

CREATE TEMP TABLE _parking_edges_way_attrs AS
SELECT
  w.chain_id,
  w.dump_path,
  array_agg(
    w.way_id
    ORDER BY
      w.locate
  ) AS way_ids,
  array_agg(
    w.reversed
    ORDER BY
      w.locate
  ) AS way_reversed
FROM
  (
    SELECT DISTINCT
      ON (o.chain_id, o.dump_path, s.way_id) o.chain_id,
      o.dump_path,
      s.way_id,
      ST_LineLocatePoint (o.geom, ST_LineInterpolatePoint (s.geom, 0.5)) AS locate,
      ST_LineLocatePoint (o.geom, ST_StartPoint (s.geom)) > ST_LineLocatePoint (o.geom, ST_EndPoint (s.geom)) AS reversed
    FROM
      _parking_edges_oriented o
      JOIN _parking_edges_seg_on_edge s ON s.chain_id = o.chain_id
      AND s.dump_path = o.dump_path
    ORDER BY
      o.chain_id,
      o.dump_path,
      s.way_id,
      s.idx_from
  ) w
GROUP BY
  w.chain_id,
  w.dump_path;

-- 8. Snap start/end OSM nodes (prefer vertices), then a stable id from the node pair.
-- Duplicate base_ids (ST_Dump split the same chain) get a 4-char geom hash; leftover collisions get `-n`.
DROP TABLE IF EXISTS _parking_edges_part_nodes;

CREATE TEMP TABLE _parking_edges_part_nodes AS
SELECT DISTINCT
  s.chain_id,
  s.dump_path,
  n.node_id,
  nd.geom,
  d.is_vertex
FROM
  _parking_edges_seg_on_edge s
  JOIN LATERAL (
    VALUES
      (s.from_node),
      (s.to_node)
  ) n (node_id) ON TRUE
  JOIN _parking_edges_nodes nd ON nd.node_id = n.node_id
  JOIN _parking_edges_degree d ON d.node_id = n.node_id;

CREATE INDEX _parking_edges_part_nodes_chain_dump_idx ON _parking_edges_part_nodes (chain_id, dump_path);

-- Closest part-node to the oriented start/end (vertices preferred over degree-2 nodes).
DROP TABLE IF EXISTS _parking_edges_start_snap;

CREATE TEMP TABLE _parking_edges_start_snap AS
SELECT DISTINCT
  ON (o.chain_id, o.dump_path) o.chain_id,
  o.dump_path,
  pn.node_id
FROM
  _parking_edges_oriented o
  JOIN _parking_edges_part_nodes pn ON pn.chain_id = o.chain_id
  AND pn.dump_path = o.dump_path
ORDER BY
  o.chain_id,
  o.dump_path,
  (NOT pn.is_vertex),
  ST_Distance (pn.geom, ST_StartPoint (o.geom)),
  pn.node_id;

DROP TABLE IF EXISTS _parking_edges_end_snap;

CREATE TEMP TABLE _parking_edges_end_snap AS
SELECT DISTINCT
  ON (o.chain_id, o.dump_path) o.chain_id,
  o.dump_path,
  pn.node_id
FROM
  _parking_edges_oriented o
  JOIN _parking_edges_part_nodes pn ON pn.chain_id = o.chain_id
  AND pn.dump_path = o.dump_path
ORDER BY
  o.chain_id,
  o.dump_path,
  (NOT pn.is_vertex),
  ST_Distance (pn.geom, ST_EndPoint (o.geom)),
  pn.node_id;

-- 0 vertices → min node twice; 1 vertex → that node both ends; else the snapped nodes.
DROP TABLE IF EXISTS _parking_edges_endpoints;

CREATE TEMP TABLE _parking_edges_endpoints AS
SELECT
  o.chain_id,
  o.dump_path,
  CASE
    WHEN cm.n_vertices = 0 THEN cm.min_node_id
    WHEN cm.n_vertices = 1 THEN COALESCE(cv.node_id, cm.min_node_id)
    ELSE COALESCE(ss.node_id, cm.min_node_id)
  END AS start_node,
  CASE
    WHEN cm.n_vertices = 0 THEN cm.min_node_id
    WHEN cm.n_vertices = 1 THEN COALESCE(cv.node_id, cm.min_node_id)
    ELSE COALESCE(es.node_id, cm.min_node_id)
  END AS end_node
FROM
  _parking_edges_oriented o
  JOIN _parking_edges_chain_meta cm ON cm.chain_id = o.chain_id
  LEFT JOIN (
    SELECT
      chain_id,
      MIN(node_id) AS node_id
    FROM
      _parking_edges_chain_vertices
    GROUP BY
      chain_id
  ) cv ON cv.chain_id = o.chain_id
  LEFT JOIN _parking_edges_start_snap ss ON ss.chain_id = o.chain_id
  AND ss.dump_path = o.dump_path
  LEFT JOIN _parking_edges_end_snap es ON es.chain_id = o.chain_id
  AND es.dump_path = o.dump_path;

-- Road name/highway from the longest way. `base_id` = min-max node pair; suffix if that pair is not unique.
DROP TABLE IF EXISTS _parking_edges_prepared;

CREATE TEMP TABLE _parking_edges_prepared AS
SELECT
  e.*,
  CASE
    WHEN COUNT(*) OVER (
      PARTITION BY
        e.base_id
    ) = 1 THEN e.base_id
    ELSE e.base_id || '-' || SUBSTR(
      md5(
        ST_AsText (
          ST_SnapToGrid (ST_LineInterpolatePoint (e.geom, 0.5), 10)
        )
      ),
      1,
      4
    )
  END AS id,
  (
    COUNT(*) OVER (
      PARTITION BY
        e.base_id
    ) > 1
  ) AS needed_suffix
FROM
  (
    SELECT
      o.chain_id,
      o.dump_path,
      o.geom,
      o.longest_way_id,
      wa.way_ids,
      wa.way_reversed,
      ep.start_node,
      ep.end_node,
      ST_Length (o.geom) AS length,
      r.tags ->> 'name' AS name,
      r.tags ->> 'highway' AS highway,
      r.tags ->> 'road' AS road,
      LEAST(ep.start_node, ep.end_node)::TEXT || '-' || GREATEST(ep.start_node, ep.end_node)::TEXT AS base_id
    FROM
      _parking_edges_oriented o
      JOIN _parking_edges_endpoints ep ON ep.chain_id = o.chain_id
      AND ep.dump_path = o.dump_path
      LEFT JOIN _parking_edges_way_attrs wa ON wa.chain_id = o.chain_id
      AND wa.dump_path = o.dump_path
      LEFT JOIN LATERAL (
        SELECT
          tags
        FROM
          _parking_roads r
        WHERE
          r.osm_id = o.longest_way_id
        LIMIT
          1
      ) r ON TRUE
  ) e;

-- If suffix hashes still collide, append a row number before insert
UPDATE _parking_edges_prepared p
SET
  id = p.id || '-' || d.rn
FROM
  (
    SELECT
      ctid,
      ROW_NUMBER() OVER (
        PARTITION BY
          id
        ORDER BY
          length DESC,
          chain_id,
          dump_path
      ) AS rn,
      COUNT(*) OVER (
        PARTITION BY
          id
      ) AS n
    FROM
      _parking_edges_prepared
  ) d
WHERE
  p.ctid = d.ctid
  AND d.n > 1
  AND d.rn > 1;

CREATE UNIQUE INDEX _parking_edges_prepared_id_idx ON _parking_edges_prepared (id);

-- 9. Allocate `parkings` onto edges.
-- Join spatially to `_parking_kerbs`. Do not use original_ids (those ids contain '-').
-- `_parking_parkings_merged` still includes parkings_no so it over-counts; use `parkings`.
-- Public and private capacities are both stored; losing stalls stay in `capacity_*` / `capacity_private_*`.
--
-- BE AWARE: Road-derived parkings lie on `_parking_kerbs`. `separate_parking_areas` lines are
-- the polygon's road-facing edge (from `tilda_parking_area_to_line`, see
-- `separate_parkings/0_areas_project_to_kerb.sql`) and sit 1–5 m off the kerb, hence the 6 m
-- radius + nearest-kerb rule.
DROP TABLE IF EXISTS _parking_edges_parkings_5243;

CREATE TEMP TABLE _parking_edges_parkings_5243 AS
SELECT
  p.id,
  p.tags,
  ST_Transform (p.geom, 5243) AS geom
FROM
  parkings p
WHERE
  p.tags ->> 'operator_type' IN ('public', 'private')
  AND (p.tags ->> 'capacity')::NUMERIC > 0;

CREATE INDEX _parking_edges_parkings_5243_geom_idx ON _parking_edges_parkings_5243 USING GIST (geom);

DO $$ BEGIN RAISE NOTICE 'parking edges clipping kerbs and allocating parkings at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- Clip each OSM-way kerb to the node–node piece on this edge, then intersect `parkings`.
-- Capacity follows parking geometry on that block (a line that straddles a cut is split
-- by intersection length). Do not smear by `seg_len / way_len`.
DROP TABLE IF EXISTS _parking_edges_way_on_edge;

CREATE TEMP TABLE _parking_edges_way_on_edge AS
SELECT
  p.id AS edge_id,
  u.way_id,
  COALESCE(p.way_reversed[u.ord], FALSE) AS reversed,
  (d).geom AS geom
FROM
  _parking_edges_prepared p
  CROSS JOIN LATERAL unnest(p.way_ids) WITH ORDINALITY AS u (way_id, ord)
  JOIN LATERAL (
    SELECT
      ST_LineMerge (ST_Union (s.geom)) AS geom
    FROM
      _parking_edges_seg_on_edge s
    WHERE
      s.chain_id = p.chain_id
      AND s.dump_path = p.dump_path
      AND s.way_id = u.way_id
  ) merged ON merged.geom IS NOT NULL
  CROSS JOIN LATERAL ST_Dump (merged.geom) AS d
WHERE
  GeometryType ((d).geom) = 'LINESTRING'
  AND ST_NPoints ((d).geom) >= 2;

CREATE INDEX _parking_edges_way_on_edge_way_id_idx ON _parking_edges_way_on_edge (way_id);

DROP TABLE IF EXISTS _parking_edges_kerb_clip;

CREATE TEMP TABLE _parking_edges_kerb_clip AS
SELECT
  w.edge_id,
  w.way_id,
  w.reversed,
  k.side,
  clip.geom
FROM
  _parking_edges_way_on_edge w
  JOIN _parking_kerbs k ON k.osm_id = w.way_id
  AND GeometryType (k.geom) = 'LINESTRING'
  CROSS JOIN LATERAL (
    SELECT
      LEAST(f1, f2) AS frac_lo,
      GREATEST(f1, f2) AS frac_hi
    FROM
      (
        SELECT
          ST_LineLocatePoint (
            k.geom,
            ST_ClosestPoint (k.geom, ST_StartPoint (w.geom))
          ) AS f1,
          ST_LineLocatePoint (
            k.geom,
            ST_ClosestPoint (k.geom, ST_EndPoint (w.geom))
          ) AS f2
      ) t
  ) loc
  CROSS JOIN LATERAL (
    SELECT
      ST_LineSubstring (k.geom, loc.frac_lo, loc.frac_hi) AS geom
  ) clip
WHERE
  loc.frac_hi - loc.frac_lo > 0.000001
  AND ST_Length (clip.geom) > 0.05;

CREATE INDEX _parking_edges_kerb_clip_geom_idx ON _parking_edges_kerb_clip USING GIST (geom);

CREATE INDEX _parking_edges_kerb_clip_edge_id_idx ON _parking_edges_kerb_clip (edge_id);

-- Parking pieces on each edge. Flip kerb side when the OSM way is reversed vs the edge.
DROP TABLE IF EXISTS _parking_edges_alloc;

CREATE TEMP TABLE _parking_edges_alloc AS
WITH
  candidates AS (
    SELECT
      m.id AS parking_id,
      c.edge_id,
      CASE
        WHEN c.reversed THEN CASE
          c.side
          WHEN 'left' THEN 'right'
          WHEN 'right' THEN 'left'
          ELSE c.side
        END
        ELSE c.side
      END AS side,
      tilda_condition_category_primary (m.tags ->> 'condition_category') AS category,
      m.tags ->> 'parking' AS parking,
      m.tags ->> 'surface' AS surface,
      m.tags ->> 'operator_type' AS operator_type,
      (m.tags ->> 'capacity')::NUMERIC AS parking_capacity,
      ST_Length (ST_Intersection (m.geom, ST_Buffer (c.geom, t.tol))) AS piece_len,
      ST_Length (m.geom) AS parking_len,
      ST_Distance (m.geom, c.geom) AS dist
    FROM
      _parking_edges_parkings_5243 m
      CROSS JOIN LATERAL (
        SELECT
          CASE
            WHEN m.tags ->> 'source' = 'separate_parking_areas' THEN 6.0
            ELSE 1.5
          END AS tol
      ) t
      JOIN _parking_edges_kerb_clip c ON ST_DWithin (m.geom, c.geom, t.tol)
      AND (
        m.tags ->> 'side' IS NULL
        OR c.side = m.tags ->> 'side'
      )
  ),
  nearest AS (
    SELECT
      *,
      MIN(dist) OVER (PARTITION BY parking_id) AS min_dist
    FROM
      candidates
  ),
  pieces AS (
    SELECT
      parking_id,
      edge_id,
      side,
      category,
      parking,
      surface,
      operator_type,
      parking_capacity,
      piece_len,
      parking_len,
      MAX(piece_len) OVER (PARTITION BY parking_id) AS max_piece_len
    FROM
      nearest
    WHERE
      dist <= min_dist + 1.0
  ),
  tot AS (
    SELECT
      parking_id,
      SUM(piece_len) AS total_len
    FROM
      pieces
    WHERE
      piece_len > 0.05
      AND (
        piece_len > 0.2 * parking_len
        OR piece_len = max_piece_len
      )
    GROUP BY
      parking_id
  )
SELECT
  pieces.parking_id,
  pieces.edge_id,
  pieces.side,
  pieces.operator_type,
  pieces.category,
  pieces.parking,
  pieces.surface,
  (
    pieces.parking_capacity * pieces.piece_len / NULLIF(tot.total_len, 0)
  ) AS capacity
FROM
  pieces
  JOIN tot ON tot.parking_id = pieces.parking_id
WHERE
  pieces.piece_len > 0.05
  AND (
    pieces.piece_len > 0.2 * pieces.parking_len
    OR pieces.piece_len = pieces.max_piece_len
  );

CREATE INDEX _parking_edges_alloc_idx ON _parking_edges_alloc (edge_id, side, operator_type);

DO $$
DECLARE
  public_by_source TEXT;
  private_by_source TEXT;
BEGIN
  SELECT
    string_agg(source || '=' || capacity::TEXT, ', ' ORDER BY source)
  INTO public_by_source
  FROM (
    SELECT
      p.tags ->> 'source' AS source,
      ROUND(SUM((p.tags ->> 'capacity')::NUMERIC), 0) AS capacity
    FROM
      _parking_edges_parkings_5243 p
    WHERE
      p.tags ->> 'operator_type' = 'public'
      AND NOT EXISTS (
        SELECT
          1
        FROM
          _parking_edges_alloc a
        WHERE
          a.parking_id = p.id
      )
    GROUP BY
      p.tags ->> 'source'
  ) t;

  SELECT
    string_agg(source || '=' || capacity::TEXT, ', ' ORDER BY source)
  INTO private_by_source
  FROM (
    SELECT
      p.tags ->> 'source' AS source,
      ROUND(SUM((p.tags ->> 'capacity')::NUMERIC), 0) AS capacity
    FROM
      _parking_edges_parkings_5243 p
    WHERE
      p.tags ->> 'operator_type' = 'private'
      AND NOT EXISTS (
        SELECT
          1
        FROM
          _parking_edges_alloc a
        WHERE
          a.parking_id = p.id
      )
    GROUP BY
      p.tags ->> 'source'
  ) t;

  RAISE NOTICE 'parking edges unallocated public capacity by source: %', COALESCE(public_by_source, 'none');
  RAISE NOTICE 'parking edges unallocated private capacity by source: %', COALESCE(private_by_source, 'none');
  RAISE NOTICE 'parking edges allocation finished at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin';
END $$;

-- 10. Per kerb: round public/private capacity first, then pick a winner.
-- Winner and paint tags only when the rounded sum is > 0 (so we never store
-- `operator_type_*` / paint keys without a matching `capacity_*` tag).
-- Tie → public. `capacity_*` / `capacity_private_*` still sum all stalls of that operator_type.
DROP TABLE IF EXISTS _parking_edges_side_capacity;

CREATE TEMP TABLE _parking_edges_side_capacity AS
SELECT
  edge_id,
  side,
  tilda_round_capacity (
    SUM(capacity) FILTER (
      WHERE
        operator_type = 'public'
    )::NUMERIC
  ) AS capacity_public,
  tilda_round_capacity (
    SUM(capacity) FILTER (
      WHERE
        operator_type = 'private'
    )::NUMERIC
  ) AS capacity_private
FROM
  _parking_edges_alloc
GROUP BY
  edge_id,
  side;

CREATE INDEX _parking_edges_side_capacity_idx ON _parking_edges_side_capacity (edge_id, side);

DROP TABLE IF EXISTS _parking_edges_side_winner;

CREATE TEMP TABLE _parking_edges_side_winner AS
SELECT DISTINCT
  ON (edge_id, side) edge_id,
  side,
  operator_type,
  capacity
FROM
  (
    SELECT
      edge_id,
      side,
      'public' AS operator_type,
      capacity_public AS capacity
    FROM
      _parking_edges_side_capacity
    WHERE
      capacity_public > 0
    UNION ALL
    SELECT
      edge_id,
      side,
      'private',
      capacity_private
    FROM
      _parking_edges_side_capacity
    WHERE
      capacity_private > 0
  ) t
ORDER BY
  edge_id,
  side,
  capacity DESC,
  CASE
    WHEN operator_type = 'public' THEN 0
    ELSE 1
  END;

CREATE INDEX _parking_edges_side_winner_idx ON _parking_edges_side_winner (edge_id, side, operator_type);

-- Winner-subset paint: most capacity, then `tilda_condition_category_priority()` (same order as the map style).
DROP TABLE IF EXISTS _parking_edges_side_category;

CREATE TEMP TABLE _parking_edges_side_category AS
SELECT DISTINCT
  ON (x.edge_id, x.side) x.edge_id,
  x.side,
  x.category
FROM
  (
    SELECT
      a.edge_id,
      a.side,
      a.category,
      SUM(a.capacity) AS capacity
    FROM
      _parking_edges_alloc a
      JOIN _parking_edges_side_winner w ON w.edge_id = a.edge_id
      AND w.side = a.side
      AND w.operator_type = a.operator_type
    GROUP BY
      a.edge_id,
      a.side,
      a.category
  ) x
  LEFT JOIN tilda_condition_category_priority () pri ON pri.category = x.category
ORDER BY
  x.edge_id,
  x.side,
  x.capacity DESC,
  COALESCE(pri.pri, 1000);

CREATE INDEX _parking_edges_side_category_idx ON _parking_edges_side_category (edge_id, side);

-- Winner-subset `parking` / `surface` (most capacity on that side).
DROP TABLE IF EXISTS _parking_edges_side_parking;

CREATE TEMP TABLE _parking_edges_side_parking AS
SELECT DISTINCT
  ON (x.edge_id, x.side) x.edge_id,
  x.side,
  x.parking
FROM
  (
    SELECT
      a.edge_id,
      a.side,
      a.parking,
      SUM(a.capacity) AS capacity
    FROM
      _parking_edges_alloc a
      JOIN _parking_edges_side_winner w ON w.edge_id = a.edge_id
      AND w.side = a.side
      AND w.operator_type = a.operator_type
    GROUP BY
      a.edge_id,
      a.side,
      a.parking
  ) x
ORDER BY
  x.edge_id,
  x.side,
  x.capacity DESC,
  x.parking;

CREATE INDEX _parking_edges_side_parking_idx ON _parking_edges_side_parking (edge_id, side);

DROP TABLE IF EXISTS _parking_edges_side_surface;

CREATE TEMP TABLE _parking_edges_side_surface AS
SELECT DISTINCT
  ON (x.edge_id, x.side) x.edge_id,
  x.side,
  x.surface
FROM
  (
    SELECT
      a.edge_id,
      a.side,
      a.surface,
      SUM(a.capacity) AS capacity
    FROM
      _parking_edges_alloc a
      JOIN _parking_edges_side_winner w ON w.edge_id = a.edge_id
      AND w.side = a.side
      AND w.operator_type = a.operator_type
    WHERE
      a.surface IS NOT NULL
    GROUP BY
      a.edge_id,
      a.side,
      a.surface
  ) x
ORDER BY
  x.edge_id,
  x.side,
  x.capacity DESC,
  x.surface;

CREATE INDEX _parking_edges_side_surface_idx ON _parking_edges_side_surface (edge_id, side);

-- 11. Insert `parkings_edges` (3857). minzoom: length < 50 m → 13, else 0.
INSERT INTO
  parkings_edges (id, tags, meta, geom, minzoom)
SELECT
  p.id,
  jsonb_strip_nulls (
    jsonb_build_object(
      /* sql-formatter-disable */
      'name', p.name,
      'highway', p.highway,
      'road', p.road,
      'way_ids', to_jsonb(p.way_ids),
      'way_reversed', to_jsonb(p.way_reversed),
      'start_node', p.start_node,
      'end_node', p.end_node,
      'capacity_left', NULLIF(cap_l.capacity_public, 0),
      'capacity_right', NULLIF(cap_r.capacity_public, 0),
      'capacity_private_left', NULLIF(cap_l.capacity_private, 0),
      'capacity_private_right', NULLIF(cap_r.capacity_private, 0),
      'operator_type_left', win_l.operator_type,
      'operator_type_right', win_r.operator_type,
      'condition_category_left', cat_l.category,
      'condition_category_right', cat_r.category,
      'parking_left', COALESCE(pk_l.parking, 'missing'),
      'parking_right', COALESCE(pk_r.parking, 'missing'),
      'surface_left', sf_l.surface,
      'surface_right', sf_r.surface
      /* sql-formatter-enable */
    )
  ),
  '{}'::JSONB,
  ST_Transform (p.geom, 3857),
  CASE
    WHEN p.length < 50 THEN 13
    ELSE 0
  END
FROM
  _parking_edges_prepared p
  LEFT JOIN _parking_edges_side_capacity cap_l ON cap_l.edge_id = p.id
  AND cap_l.side = 'left'
  LEFT JOIN _parking_edges_side_capacity cap_r ON cap_r.edge_id = p.id
  AND cap_r.side = 'right'
  LEFT JOIN _parking_edges_side_winner win_l ON win_l.edge_id = p.id
  AND win_l.side = 'left'
  LEFT JOIN _parking_edges_side_winner win_r ON win_r.edge_id = p.id
  AND win_r.side = 'right'
  LEFT JOIN _parking_edges_side_category cat_l ON cat_l.edge_id = p.id
  AND cat_l.side = 'left'
  LEFT JOIN _parking_edges_side_category cat_r ON cat_r.edge_id = p.id
  AND cat_r.side = 'right'
  LEFT JOIN _parking_edges_side_parking pk_l ON pk_l.edge_id = p.id
  AND pk_l.side = 'left'
  LEFT JOIN _parking_edges_side_parking pk_r ON pk_r.edge_id = p.id
  AND pk_r.side = 'right'
  LEFT JOIN _parking_edges_side_surface sf_l ON sf_l.edge_id = p.id
  AND sf_l.side = 'left'
  LEFT JOIN _parking_edges_side_surface sf_r ON sf_r.edge_id = p.id
  AND sf_r.side = 'right'
WHERE
  EXISTS (
    SELECT
      1
    FROM
      parkings
  );

DROP INDEX IF EXISTS parkings_edges_geom_idx;

CREATE INDEX parkings_edges_geom_idx ON parkings_edges USING GIST (geom);

DROP INDEX IF EXISTS unique_parkings_edges_id_idx;

CREATE UNIQUE INDEX unique_parkings_edges_id_idx ON parkings_edges (id);

-- Coverage vs `parkings.capacity`, suffix collisions, empty way_ids, vertex-count histogram.
DO $$
DECLARE
  edge_count INTEGER;
  edge_public_capacity NUMERIC;
  edge_private_capacity NUMERIC;
  public_parking_capacity NUMERIC;
  private_parking_capacity NUMERIC;
  public_coverage NUMERIC;
  private_side_count INTEGER;
  suffix_count INTEGER;
  empty_way_ids INTEGER;
  histogram TEXT;
BEGIN
  SELECT COUNT(*) INTO edge_count FROM parkings_edges;

  SELECT
    COALESCE(
      SUM(
        COALESCE((tags ->> 'capacity_left')::NUMERIC, 0)
        + COALESCE((tags ->> 'capacity_right')::NUMERIC, 0)
      ),
      0
    )
  INTO edge_public_capacity
  FROM parkings_edges;

  SELECT
    COALESCE(
      SUM(
        COALESCE((tags ->> 'capacity_private_left')::NUMERIC, 0)
        + COALESCE((tags ->> 'capacity_private_right')::NUMERIC, 0)
      ),
      0
    )
  INTO edge_private_capacity
  FROM parkings_edges;

  SELECT
    COALESCE(SUM((tags ->> 'capacity')::NUMERIC), 0)
  INTO public_parking_capacity
  FROM parkings
  WHERE
    tags ->> 'operator_type' = 'public'
    AND (tags ->> 'capacity')::NUMERIC > 0;

  SELECT
    COALESCE(SUM((tags ->> 'capacity')::NUMERIC), 0)
  INTO private_parking_capacity
  FROM parkings
  WHERE
    tags ->> 'operator_type' = 'private'
    AND (tags ->> 'capacity')::NUMERIC > 0;

  public_coverage := CASE
    WHEN public_parking_capacity = 0 THEN NULL
    ELSE ROUND(100.0 * edge_public_capacity / public_parking_capacity, 2)
  END;

  SELECT
    COUNT(*)
  INTO private_side_count
  FROM parkings_edges
  WHERE
    tags ->> 'operator_type_left' = 'private'
    OR tags ->> 'operator_type_right' = 'private';

  SELECT COUNT(*) INTO suffix_count FROM _parking_edges_prepared WHERE needed_suffix;

  SELECT
    COUNT(*)
  INTO empty_way_ids
  FROM parkings_edges
  WHERE
    tags -> 'way_ids' IS NULL
    OR jsonb_typeof(tags -> 'way_ids') <> 'array'
    OR jsonb_array_length(tags -> 'way_ids') = 0;

  SELECT
    string_agg(n_vertices::TEXT || ':' || n_chains::TEXT, ', ' ORDER BY n_vertices)
  INTO histogram
  FROM (
    SELECT
      n_vertices,
      COUNT(*) AS n_chains
    FROM
      _parking_edges_chain_meta
    GROUP BY
      n_vertices
  ) h;

  RAISE NOTICE 'parking edges: % row(s)', edge_count;
  RAISE NOTICE 'parking edges public capacity sum(left+right)=% vs public parkings.capacity=% (coverage % %%); private capacity sum=% vs private parkings.capacity=%; private-winning sides on % edge(s)', edge_public_capacity, public_parking_capacity, public_coverage, edge_private_capacity, private_parking_capacity, private_side_count;
  RAISE NOTICE 'parking edges duplicate base-id rows that needed a suffix: %', suffix_count;
  RAISE NOTICE 'parking edges with empty way_ids: %', empty_way_ids;
  RAISE NOTICE 'parking edges chain vertex-count histogram (n_vertices:n_chains): %', histogram;
  RAISE NOTICE 'END creating parking edges at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin';
END $$;
