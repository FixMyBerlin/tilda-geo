-- Entry point for is_sidepath estimation (CSV export).
-- Temp tables for paths and roads in SRID 3857 with GIST indexes so the spatial join uses index lookups.
-- Invoke with: psql -v outfile=/path/to/is_sidepath_estimation.csv -f run_is_sidepath_estimation.sql (outfile required)
-- Optional: -v buffer_distance=190.0 -v buffer_size=22.0 (defaults set in is_sidepath_estimation.sql).
--

-- Temp tables in 3857 (meters) so ST_DWithin in the join can use GIST indexes.
-- Paths: dedicated source rows from roads_bikelanes topic (highway filter in Lua — KEEP IN SYNC with
-- topics/helper/highway_classes.lua `sidepath_highway_classes` via roads_bikelanes_sidepath_source_paths.lua;
-- that writer also skips Fahrradstraße / Fußgängerzone-Rad-frei and flags crossings
-- via `path_is_crossing` (roads.road crossing classes, not bike-only `is_crossing_pattern`).
DROP TABLE IF EXISTS _sidepath_estimation_paths;
CREATE TEMP TABLE _sidepath_estimation_paths AS
SELECT
  osm_id,
  geom::geometry AS geom,
  layer,
  COALESCE(is_crossing, false) AS is_crossing
FROM "_roads_bikelanes_sidepath_source_paths";
CREATE INDEX _sidepath_estimation_paths_geom_idx ON _sidepath_estimation_paths USING GIST (geom);
ANALYZE _sidepath_estimation_paths;

-- Roads: classes a path can be a sidepath of (CQI / OSM-Sidepath-Estimation ST_DWithin join).
-- The "roads" table stores class in tags->>'road' (RoadClassificationRoadValue), not OSM highway.
-- The estimator's internal JSON bucket is still named `highway`; the values are TILDA `road`.
--
-- Deliberately narrower than the full `roads` table:
-- - motorway/trunk (+ links): no bike sidepaths along Autobahn/Schnellstraße in CQI; long geometries
--   add ST_DWithin cost and false positives when paths run near but not along them.
-- - service_*: excluded for export performance; paths beside service use OSM is_sidepath=yes or
--   bikelane subcategory handling (highway=service → isolated).
-- Settlement-area estimation is unrelated — it classifies all rows in `roads` (see
-- pseudo_tags_settlement_area/sql/run_settlement_area_estimation.sql).
--
-- KEEP IN SYNC — TILDA `roads.tags->>'road'` values in the IN list below. When adding or removing
-- classes here, also update `tilda_sidepath_highway_rank` in is_sidepath_estimation.sql.
DROP TABLE IF EXISTS _sidepath_estimation_roads;
CREATE TEMP TABLE _sidepath_estimation_roads AS
SELECT
  osm_id,
  geom::geometry AS geom,
  tags->>'road' AS road,
  tags->>'name' AS name,
  tags->>'layer' AS layer,
  tags->>'maxspeed' AS maxspeed
FROM "roads"
WHERE (tags->>'road') IN (
  -- 'motorway', 'motorway_link', 'trunk', 'trunk_link',
  'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link',
  'unclassified', 'residential', 'residential_priority_road', 'unspecified_road',
  'living_street', 'pedestrian'
  -- 'service_road', 'service_alley', 'service_driveway',
  -- 'service_emergency_access', 'service_parking_aisle'
);
CREATE INDEX _sidepath_estimation_roads_geom_idx ON _sidepath_estimation_roads USING GIST (geom);
ANALYZE _sidepath_estimation_roads;

-- Custom functions and default parameters (buffer_distance, buffer_size)
\i '/processing/topics/roads_bikelanes/pseudo_tags_sidepath/sql/is_sidepath_estimation.sql'

-- Debug: Create table that help to understand the estimation rules
-- \i '/processing/topics/roads_bikelanes/pseudo_tags_sidepath/sql/debug_is_sidepath.sql'

SELECT setval('tilda_sidepath_checkpoint_nr_sequence', 1);

DROP TABLE IF EXISTS _sidepath_estimation_result;
CREATE TEMP TABLE _sidepath_estimation_result AS
SELECT * FROM tilda_sidepath_csv(:buffer_distance, :buffer_size);

-- Full export table for /api/pseudo-tags-export/sidepath (all path candidates, not sparse Lua CSV).
TRUNCATE public.pseudo_tag_export_sidepath;

INSERT INTO public.pseudo_tag_export_sidepath (osm_type, osm_id, is_sidepath, adjoining_road, adjoining_maxspeed)
SELECT
  p.osm_type,
  p.osm_id,
  CASE
    WHEN s.is_sidepath_estimation::boolean IS TRUE THEN 'assumed_yes'
    ELSE 'assumed_no'
  END,
  s.adjoining_road,
  s.adjoining_maxspeed
FROM _sidepath_estimation_result s
JOIN "_roads_bikelanes_sidepath_source_paths" p ON p.osm_id = s.osm_id::bigint;

-- Redirect query output to the file passed as -v outfile=... (required)
\o :outfile

\pset format csv
\pset tuples_only off
-- Export only rows that carry information; Lua infers assumed_no for path IDs not in CSV.
-- false-rows with adjoining data feed roadsPathClasses.adjoining_* (the path writer
-- resolves adjoining context without the sidepath gate).
SELECT osm_id, is_sidepath_estimation, adjoining_road, adjoining_maxspeed
FROM _sidepath_estimation_result
WHERE is_sidepath_estimation::boolean IS TRUE
   OR adjoining_road IS NOT NULL;

\o
