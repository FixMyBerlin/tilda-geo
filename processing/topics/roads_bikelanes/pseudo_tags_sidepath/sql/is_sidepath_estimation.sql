-------------------------------------------
-- is_sidepath estimation (CSV output only).
-- Adapted from https://github.com/lu-fennell/OSM-Sidepath-Estimation
--
-- Prerequisites: tables (created by the entry script) must expose geometry in SRID 3857 (meters):
--   _sidepath_estimation_paths(path_nr bigint, osm_id bigint, geom geometry, layer text, is_crossing boolean)
--   _sidepath_estimation_roads(osm_id bigint, geom geometry, road text, name text, layer text, maxspeed text)
-- The entry script casts source geoms to geometry in SRID 3857, so buffer_distance and buffer_size are in meters.
-- If geoms were 4326, ST_Length would be in degrees and ST_DWithin(..., 22) would be 22 degrees (wrong).
--
-- Provided: table _sidepath_estimation_result
--   (osm_id bigint, is_sidepath_estimation text, adjoining_road text, adjoining_maxspeed text)
--
-- Default parameters (override with -v when invoking the entry script):
--   buffer_distance  Distance between checkpoints along a path, in meters (default 190.0).
--   buffer_size      Radius of each checkpoint for ST_DWithin to roads, in meters (default 22.0).
--
-- Voting (per path osm_id):
--   checks  = number of checkpoints of the path.
--   votes   = number of checkpoints that see a given road id / road class / road name (NULL name = '')
--             within buffer_size on the same layer (both layers NULL or equal).
--   is_sidepath when any road id, class or name passes `tilda_sidepath_is_sidepath_by_checks`.
--   adjoining_road = road class with most votes (ties: `tilda_sidepath_highway_rank`);
--   adjoining_maxspeed = highest numeric maxspeed of that class among the hits.
--
-- Written as plain set-based CREATE TABLE AS steps (no sequences, no custom aggregates) so Postgres
-- can use parallel workers for the checkpoint and spatial join steps.
-------------------------------------------

\if :{?buffer_distance} \else \set buffer_distance 190.0 \endif
\if :{?buffer_size} \else \set buffer_size 22.0 \endif

-- Objects of the former JSONB aggregate implementation (quiet: they only exist once per database).
SET client_min_messages = warning;
DROP FUNCTION IF EXISTS tilda_sidepath_csv(double precision, double precision);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_checkpoints_and_roads_left_outer_join(double precision, double precision);
DROP AGGREGATE IF EXISTS tilda_sidepath_dict_agg(bigint, text, bigint, text, text, text, text);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_acc(jsonb, bigint, text, bigint, text, text, text, text);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_add_result(jsonb, jsonb, bigint, text, bigint, text, text, text, text);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_add_visited(jsonb, bigint, text, bigint, text, text, text);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_acc_init_if_null(jsonb);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_get_result(jsonb);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_is_sidepath(jsonb);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_is_sidepath_by_checks(integer, jsonb);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_dominant_highway(jsonb);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_adjoining_maxspeed(jsonb, text);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_max_field(jsonb, text, text);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_valid_speed(text);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_inc_field(jsonb, jsonb, text, bigint);
DROP FUNCTION IF EXISTS tilda_sidepath_integer_inc_not_visited(jsonb, text, integer);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_add_entry(jsonb, text, bigint);
DROP FUNCTION IF EXISTS tilda_sidepath_jsonb_intset_add(jsonb, bigint);
DROP FUNCTION IF EXISTS tilda_sidepath_jsonb_get_or_default(jsonb, text, jsonb);
DROP FUNCTION IF EXISTS tilda_sidepath_text_both_null_or_eq(text, text);
DROP FUNCTION IF EXISTS tilda_sidepath_text_empty_if_null(text);
DROP SEQUENCE IF EXISTS tilda_sidepath_checkpoint_nr_sequence;
RESET client_min_messages;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_interpolated_points(point_distance float, geom geometry) RETURNS setof geometry AS $$
  -- Inset ends by 20 m so start/end don't vote on the crossing street.
  -- Paths shorter than 40 m: one midpoint (too short for inset+mid+inset).
  -- Do not ST_Union (it silently collapses nearby points and lowers `checks`).
  SELECT pt FROM (
    SELECT ST_LineInterpolatePoint(geom, 0.5) AS pt
    WHERE ST_Length(geom) < 40
    UNION ALL
    SELECT ST_LineInterpolatePoint(geom, LEAST(1.0, GREATEST(0.0, 20.0 / NULLIF(ST_Length(geom), 0))))
    WHERE ST_Length(geom) >= 40
    UNION ALL
    SELECT ST_LineInterpolatePoint(geom, 0.5)
    WHERE ST_Length(geom) >= 40
    UNION ALL
    SELECT ST_LineInterpolatePoint(geom, 1.0 - LEAST(1.0, GREATEST(0.0, 20.0 / NULLIF(ST_Length(geom), 0))))
    WHERE ST_Length(geom) >= 40
    UNION ALL
    SELECT (ST_Dump(ST_LineInterpolatePoints(geom, point_distance / ST_Length(geom)))).geom
    WHERE ST_Length(geom) >= GREATEST(point_distance, 40)
  ) s
  WHERE pt IS NOT NULL
$$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

CREATE OR REPLACE FUNCTION tilda_sidepath_is_sidepath_by_checks(checks bigint, votes bigint) RETURNS boolean AS $$
  -- checks=1: path shorter than 40 m (single midpoint). A hit is enough — otherwise every
  -- short sidepath (cycleway links, sidewalk stubs) would be assumed_no while adjoining_* is set.
  -- checks=2: both checkpoints must agree.
  -- checks>=3: 66 % majority.
  SELECT
    (checks = 1 AND votes = 1)
    OR (checks = 2 AND votes = checks)
    OR (checks >= 3 AND checks::float * 0.66 <= votes::float)
$$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

-- KEEP IN SYNC — ranks TILDA `roads.tags->>'road'` values.
-- Must cover every class in run_is_sidepath_estimation.sql's `_sidepath_estimation_roads` IN list
-- (same string literals). When that IN list changes, update this CASE … END ordering too.
CREATE OR REPLACE FUNCTION tilda_sidepath_highway_rank(highway text) RETURNS integer AS $$
  SELECT CASE highway
    WHEN 'primary' THEN 0
    WHEN 'primary_link' THEN 1
    WHEN 'secondary' THEN 2
    WHEN 'secondary_link' THEN 3
    WHEN 'tertiary' THEN 4
    WHEN 'tertiary_link' THEN 5
    WHEN 'unclassified' THEN 6
    WHEN 'residential_priority_road' THEN 7
    WHEN 'residential' THEN 8
    WHEN 'unspecified_road' THEN 9
    WHEN 'living_street' THEN 10
    WHEN 'pedestrian' THEN 11
    ELSE 999
  END
$$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

-- One row per checkpoint; (path_nr, nr) identifies it.
DROP TABLE IF EXISTS public._sidepath_estimation_checkpoints;
\echo 'sidepath: checkpoints'
\timing on
CREATE UNLOGGED TABLE public._sidepath_estimation_checkpoints AS
SELECT
  p.path_nr,
  pt.nr,
  p.osm_id,
  p.layer,
  pt.geom
FROM public._sidepath_estimation_paths p
CROSS JOIN LATERAL tilda_sidepath_dict_interpolated_points(:buffer_distance, p.geom) WITH ORDINALITY AS pt(geom, nr)
WHERE NOT p.is_crossing;
\timing off

-- Checkpoint × road pairs within buffer_size on the same layer.
DROP TABLE IF EXISTS public._sidepath_estimation_hits;
\echo 'sidepath: hits'
\timing on
CREATE UNLOGGED TABLE public._sidepath_estimation_hits AS
SELECT
  c.osm_id,
  c.path_nr,
  c.nr,
  r.osm_id AS road_id,
  r.road,
  COALESCE(r.name, '') AS name,
  r.maxspeed
FROM public._sidepath_estimation_checkpoints c
JOIN public._sidepath_estimation_roads r ON ST_DWithin(c.geom, r.geom, :buffer_size)
WHERE c.layer IS NOT DISTINCT FROM r.layer;
\timing off

DROP TABLE IF EXISTS public._sidepath_estimation_result;
\echo 'sidepath: votes'
\timing on
CREATE UNLOGGED TABLE public._sidepath_estimation_result AS
WITH checks AS (
  SELECT osm_id, count(*) AS checks
  FROM public._sidepath_estimation_checkpoints
  GROUP BY osm_id
),
id_votes AS (
  SELECT osm_id, count(DISTINCT (path_nr, nr)) AS votes
  FROM public._sidepath_estimation_hits
  GROUP BY osm_id, road_id
),
road_votes AS (
  SELECT osm_id, road, count(DISTINCT (path_nr, nr)) AS votes
  FROM public._sidepath_estimation_hits
  GROUP BY osm_id, road
),
name_votes AS (
  SELECT osm_id, count(DISTINCT (path_nr, nr)) AS votes
  FROM public._sidepath_estimation_hits
  GROUP BY osm_id, name
),
all_votes AS (
  SELECT osm_id, votes FROM id_votes
  UNION ALL
  SELECT osm_id, votes FROM road_votes
  UNION ALL
  SELECT osm_id, votes FROM name_votes
),
sidepaths AS (
  SELECT DISTINCT v.osm_id
  FROM all_votes v
  JOIN checks c USING (osm_id)
  WHERE tilda_sidepath_is_sidepath_by_checks(c.checks, v.votes)
),
dominant_road AS (
  SELECT DISTINCT ON (osm_id) osm_id, road
  FROM road_votes
  ORDER BY osm_id, votes DESC, tilda_sidepath_highway_rank(road)
),
maxspeeds AS (
  SELECT osm_id, road, max(maxspeed::numeric)::text AS maxspeed
  FROM public._sidepath_estimation_hits
  WHERE maxspeed ~ '^[0-9][0-9.]*$'
  GROUP BY osm_id, road
)
-- Non-crossings: checkpoint vote.
SELECT
  c.osm_id,
  (s.osm_id IS NOT NULL)::text AS is_sidepath_estimation,
  d.road AS adjoining_road,
  m.maxspeed AS adjoining_maxspeed
FROM checks c
LEFT JOIN sidepaths s USING (osm_id)
LEFT JOIN dominant_road d USING (osm_id)
LEFT JOIN maxspeeds m ON m.osm_id = c.osm_id AND m.road = d.road
UNION ALL
-- Crossings: the road this geometry actually intersects (highest class if several arms).
-- Not a sidepath; traffic islands that hit no centerline stay empty.
SELECT
  p.osm_id,
  'false',
  x.road,
  x.maxspeed
FROM public._sidepath_estimation_paths p
LEFT JOIN LATERAL (
  SELECT r.road, r.maxspeed
  FROM public._sidepath_estimation_roads r
  WHERE ST_Intersects(p.geom, r.geom)
  ORDER BY tilda_sidepath_highway_rank(r.road), r.osm_id
  LIMIT 1
) x ON true
WHERE p.is_crossing;
\timing off
