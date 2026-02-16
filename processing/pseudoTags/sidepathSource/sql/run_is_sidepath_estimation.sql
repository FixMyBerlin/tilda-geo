-- Entry point for is_sidepath estimation (CSV export).
-- Creates views over raw tables, loads functions, then exports CSV.
-- Invoke with: psql -v outfile=/path/to/is_sidepath_estimation.csv -f run_is_sidepath_estimation.sql (outfile required)
-- Optional: -v buffer_distance=100.0 -v buffer_size=22.0 (defaults set in is_sidepath_estimation.sql).
--

-- Views over raw tables (osm_id, geom, flat tags). Geometry is normalized to SRID 3857 (meters)
-- so that buffer_distance and buffer_size are always in meters (ST_Length, ST_DWithin, ST_Buffer).
-- Paths: ways we want to estimate is_sidepath for (roadsPathClasses = path, footway, cycleway, track, steps).
CREATE OR REPLACE TEMP VIEW _sidepath_estimation_paths AS
SELECT osm_id, ST_Transform(geom::geometry, 3857) AS geom, tags
FROM "roadsPathClasses";

-- Roads: only "main road" types that can have a sidepath (CQI / OSM-Sidepath-Estimation).
-- We restrict to residential and up (plus pedestrian); excludes service.
-- The "roads" table stores class in tags->>'road' (RoadClassificationRoadValue), not "highway". Filter on that.
-- Expose it as tags.highway so estimation (tilda_sidepath_dict_*) sees the road class.
CREATE OR REPLACE TEMP VIEW _sidepath_estimation_roads AS
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

-- Custom functions and default parameters (buffer_distance, buffer_size)
\i '/processing/pseudoTags/sidepathSource/sql/is_sidepath_estimation.sql'

-- Debug: Create table that help to understand the estimation rules
-- \i '/processing/pseudoTags/sidepathSource/sql/debug_is_sidepath.sql'

SELECT setval('tilda_sidepath_checkpoint_nr_sequence', 1);

-- Redirect query output to the file passed as -v outfile=... (required)
\o :outfile

\pset format csv
\pset tuples_only off
SELECT * FROM tilda_sidepath_csv(:buffer_distance, :buffer_size);

\o
