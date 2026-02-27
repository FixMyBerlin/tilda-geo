-- Entry point for is_sidepath estimation (CSV export).
-- Temp tables for paths and roads in SRID 3857 with GIST indexes so the spatial join uses index lookups.
-- Invoke with: psql -v outfile=/path/to/is_sidepath_estimation.csv -f run_is_sidepath_estimation.sql (outfile required)
-- Optional: -v buffer_distance=100.0 -v buffer_size=22.0 (defaults set in is_sidepath_estimation.sql).
--

-- Temp tables in 3857 (meters) so ST_DWithin in the join can use GIST indexes.
-- Paths: ways we want to estimate is_sidepath for (roadsPathClasses = path, footway, cycleway, track, steps).
DROP TABLE IF EXISTS _sidepath_estimation_paths;
CREATE TEMP TABLE _sidepath_estimation_paths AS
SELECT osm_id, ST_Transform(geom::geometry, 3857) AS geom, tags
FROM "roadsPathClasses";
CREATE INDEX _sidepath_estimation_paths_geom_idx ON _sidepath_estimation_paths USING GIST (geom);

-- Roads: only "main road" types that can have a sidepath (CQI / OSM-Sidepath-Estimation).
-- We restrict to residential and up (plus pedestrian); excludes service.
-- The "roads" table stores class in tags->>'road' (RoadClassificationRoadValue), not "highway". Filter on that.
-- Expose it as tags.highway so estimation (tilda_sidepath_dict_*) sees the road class.
DROP TABLE IF EXISTS _sidepath_estimation_roads;
CREATE TEMP TABLE _sidepath_estimation_roads AS
SELECT
  osm_id,
  ST_Transform(geom::geometry, 3857) AS geom,
  tags || jsonb_build_object('highway', tags->>'road') AS tags
FROM "roads"
WHERE (tags->>'road') IN (
  'motorway', 'motorway_link', 'trunk', 'trunk_link',
  'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link',
  'unclassified', 'residential', 'residential_priority_road', 'unspecified_road',
  'living_street', 'pedestrian'
);
CREATE INDEX _sidepath_estimation_roads_geom_idx ON _sidepath_estimation_roads USING GIST (geom);

-- Custom functions and default parameters (buffer_distance, buffer_size)
\i '/processing/pseudoTags/sidepathSource/sql/is_sidepath_estimation.sql'

-- Debug: Create table that help to understand the estimation rules
-- \i '/processing/pseudoTags/sidepathSource/sql/debug_is_sidepath.sql'

SELECT setval('tilda_sidepath_checkpoint_nr_sequence', 1);

-- Redirect query output to the file passed as -v outfile=... (required)
\o :outfile

\pset format csv
\pset tuples_only off
-- Only export paths estimated as sidepath (assumed_yes); Lua infers assumed_no for path IDs not in CSV
SELECT osm_id, is_sidepath_estimation
FROM tilda_sidepath_csv(:buffer_distance, :buffer_size)
WHERE is_sidepath_estimation = 't';

\o
