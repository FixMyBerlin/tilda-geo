-------------------------------------------
-- is_sidepath estimation (CSV output only).
-- Adapted from https://github.com/lu-fennell/OSM-Sidepath-Estimation
--
-- Prerequisites: views (created by the entry script) must expose geometry in SRID 3857 (meters):
--   _sidepath_estimation_paths(osm_id bigint, geom geometry, layer text) -- geom in 3857
--   _sidepath_estimation_roads(osm_id bigint, geom geometry, highway text, name text, layer text, maxspeed text) -- geom in 3857
-- The entry script casts source geoms to geometry in SRID 3857, so buffer_distance and buffer_size are in meters.
-- If geoms were 4326, ST_Length would be in degrees and ST_DWithin(..., 22) would be 22 degrees (wrong).
--
-- Provided: tilda_sidepath_csv(buffer_distance, buffer_size) ->
--   (osm_id text, is_sidepath_estimation text, adjoining_road text, adjoining_maxspeed text)
--
-- Default parameters (override with -v when invoking the entry script):
--   buffer_distance  Distance between checkpoints along a path, in meters (default 190.0).
--   buffer_size      Radius of each checkpoint for ST_DWithin to roads, in meters (default 22.0).
-------------------------------------------

\if :{?buffer_distance} \else \set buffer_distance 190.0 \endif
\if :{?buffer_size} \else \set buffer_size 22.0 \endif

BEGIN;

-- Input temp tables _sidepath_estimation_paths and _sidepath_estimation_roads must exist
-- (created by the entry script).

CREATE SEQUENCE IF NOT EXISTS tilda_sidepath_checkpoint_nr_sequence;

CREATE OR REPLACE FUNCTION tilda_sidepath_text_empty_if_null(t text) RETURNS text AS $$
  SELECT CASE WHEN t IS NULL THEN '' ELSE t END
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_text_both_null_or_eq(v1 text, v2 text) RETURNS boolean AS $$
  SELECT (v1 IS NULL AND v2 IS NULL) OR v1 = v2
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_jsonb_get_or_default(o jsonb, k text, df jsonb) RETURNS jsonb AS $$
  SELECT CASE WHEN o ? k THEN o -> k ELSE df END
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_jsonb_intset_add(o jsonb, n bigint) RETURNS jsonb AS $$
  SELECT jsonb_set(o, ARRAY[n::text], 'true'::jsonb)
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_add_entry(o jsonb, k text, buffer_id bigint) RETURNS jsonb AS $$
  SELECT CASE WHEN k is NULL
    THEN
      o
    ELSE
      jsonb_set(o, ARRAY[k], tilda_sidepath_jsonb_intset_add(tilda_sidepath_jsonb_get_or_default(o, k, '{}'::jsonb), buffer_id))
    END
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_integer_inc_not_visited(visited jsonb, t text, n integer) RETURNS integer AS $$
  SELECT CASE WHEN visited ? t THEN n ELSE n + 1 END
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_inc_field(o jsonb, visited jsonb, field text, buffer_id bigint) RETURNS jsonb AS $$
  SELECT CASE WHEN field IS NULL
    THEN
      o
    ELSE
      jsonb_set(o, ARRAY[field], to_jsonb(tilda_sidepath_integer_inc_not_visited(visited -> field, buffer_id::text, tilda_sidepath_jsonb_get_or_default(o, field, '0'::jsonb)::integer)))
    END
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_valid_speed(v text) RETURNS boolean AS $$
  SELECT v IS NOT NULL AND v ~ '^[0-9][0-9.]*$'
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_max_field(o jsonb, field text, value text) RETURNS jsonb AS $$
  SELECT CASE WHEN field IS NOT NULL AND tilda_sidepath_dict_valid_speed(value)
    THEN
      jsonb_set(
        o,
        ARRAY[field],
        to_jsonb(
          GREATEST(
            tilda_sidepath_jsonb_get_or_default(o, field, to_jsonb(value::numeric))::numeric,
            value::numeric
          )
        )
      )
    ELSE
      o
    END
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_add_result(
  result jsonb,
  visited jsonb,
  buffer_id bigint,
  buffer_layer text,
  road_id bigint,
  road_highway text,
  road_name text,
  road_layer text,
  road_maxspeed text
) RETURNS jsonb AS $$
  SELECT
    jsonb_set(
      result,
      ARRAY['checks'], to_jsonb(tilda_sidepath_integer_inc_not_visited(visited -> 'nrs', buffer_id::text, (result -> 'checks')::integer))
    ) || CASE WHEN road_id IS NOT NULL AND tilda_sidepath_text_both_null_or_eq(buffer_layer, road_layer)
         THEN
           jsonb_build_object(
             'id', tilda_sidepath_dict_inc_field(result -> 'id', visited -> 'road_ids', road_id::text, buffer_id),
             'highway', tilda_sidepath_dict_inc_field(result -> 'highway', visited -> 'highways', road_highway, buffer_id),
             'name', tilda_sidepath_dict_inc_field(result -> 'name', visited -> 'names', tilda_sidepath_text_empty_if_null(road_name), buffer_id),
             'maxspeed', tilda_sidepath_dict_max_field(result -> 'maxspeed', road_highway, road_maxspeed)
           )
         ELSE
           '{}'::jsonb
         END
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_add_visited(
  visited jsonb,
  buffer_id bigint,
  buffer_layer text,
  road_id bigint,
  road_highway text,
  road_name text,
  road_layer text
) RETURNS jsonb AS $$
  SELECT
    jsonb_set(
      visited,
      ARRAY['nrs'], tilda_sidepath_jsonb_intset_add(visited -> 'nrs', buffer_id)
    ) || CASE WHEN road_id IS NOT NULL AND tilda_sidepath_text_both_null_or_eq(buffer_layer, road_layer)
         THEN
           jsonb_build_object(
                 'road_ids', tilda_sidepath_dict_add_entry(visited -> 'road_ids', road_id::text, buffer_id),
                 'highways', tilda_sidepath_dict_add_entry(visited -> 'highways', road_highway, buffer_id),
                 'names', tilda_sidepath_dict_add_entry(visited -> 'names', tilda_sidepath_text_empty_if_null(road_name), buffer_id)
            )
         ELSE
           '{}'::jsonb
         END
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_acc_init_if_null(acc jsonb) RETURNS jsonb AS $$
  SELECT CASE WHEN acc IS NULL
    THEN '{
      "visited": { "nrs": {}, "road_ids": {}, "highways": {}, "names": {} },
      "result": { "checks": 0, "id": {}, "highway": {}, "name": {}, "maxspeed": {} }
      }'::jsonb
    ELSE
      acc
    END
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_acc(
  acc jsonb,
  buffer_id bigint,
  buffer_layer text,
  road_id bigint,
  road_highway text,
  road_name text,
  road_layer text,
  road_maxspeed text
) RETURNS jsonb AS $$
  SELECT   jsonb_build_object(
      'visited', tilda_sidepath_dict_add_visited(acc -> 'visited', buffer_id, buffer_layer, road_id, road_highway, road_name, road_layer),
      'result', tilda_sidepath_dict_add_result(acc -> 'result', acc -> 'visited', buffer_id, buffer_layer, road_id, road_highway, road_name, road_layer, road_maxspeed)
      )
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_get_result(acc jsonb) RETURNS jsonb AS $$
  SELECT acc -> 'result'
$$ LANGUAGE SQL;

CREATE OR REPLACE AGGREGATE tilda_sidepath_dict_agg(
  buffer_id bigint,
  buffer_layer text,
  road_id bigint,
  road_highway text,
  road_name text,
  road_layer text,
  road_maxspeed text
) (
  sfunc = tilda_sidepath_dict_acc,
  stype = jsonb,
  finalfunc = tilda_sidepath_dict_get_result,
  initcond =  '{
      "visited": { "nrs": {}, "road_ids": {}, "highways": {}, "names": {} },
      "result": { "checks": 0, "id": {}, "highway": {}, "name": {}, "maxspeed": {} }
      }');

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
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_is_sidepath_by_checks(checks int, histogram jsonb) RETURNS boolean AS $$
  -- checks=1: path shorter than 40 m (single midpoint). A hit is enough — otherwise every
  -- short sidepath (cycleway links, sidewalk stubs) would be assumed_no while adjoining_* is set.
  -- checks=2: both checkpoints must agree.
  -- checks>=3: 66 % majority.
  SELECT EXISTS (
    SELECT value FROM jsonb_each(histogram)
    WHERE
      (checks = 1 AND value::int = 1)
      OR (checks = 2 AND value::int = checks)
      OR (checks >= 3 AND checks::float * 0.66 <= value::float)
  )
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_is_sidepath(entry jsonb) RETURNS boolean AS $$
  SELECT
    tilda_sidepath_dict_is_sidepath_by_checks((entry -> 'checks')::int, entry -> 'id')
    OR tilda_sidepath_dict_is_sidepath_by_checks((entry -> 'checks')::int, entry -> 'highway')
    OR tilda_sidepath_dict_is_sidepath_by_checks((entry -> 'checks')::int, entry -> 'name')
$$ LANGUAGE SQL;

-- KEEP IN SYNC — ranks TILDA `roads.tags->>'road'` values (exposed as road_highway in the join).
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
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_dominant_highway(entry jsonb) RETURNS text AS $$
  WITH counts AS (
    SELECT key AS highway, (value #>> '{}')::int AS cnt
    FROM jsonb_each(COALESCE(entry -> 'highway', '{}'::jsonb))
  ),
  max_cnt AS (SELECT max(cnt) AS m FROM counts),
  tied AS (
    SELECT c.highway
    FROM counts c
    JOIN max_cnt m ON c.cnt = m.m
  )
  SELECT highway
  FROM tied
  ORDER BY tilda_sidepath_highway_rank(highway)
  LIMIT 1
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION tilda_sidepath_dict_adjoining_maxspeed(entry jsonb, adjoining_road text) RETURNS text AS $$
  SELECT CASE
    WHEN adjoining_road IS NULL THEN NULL
    ELSE entry -> 'maxspeed' ->> adjoining_road
  END
$$ LANGUAGE SQL STABLE;

-- Postgres rejects CREATE OR REPLACE when the OUT row type of a RETURNS TABLE function changes.
-- Drop dependents first, then the set-returning function (e.g. after adding columns to the result row).
DROP FUNCTION IF EXISTS tilda_sidepath_csv(double precision, double precision);
DROP FUNCTION IF EXISTS tilda_sidepath_dict_checkpoints_and_roads_left_outer_join(double precision, double precision);

-- Single output used: CSV. Reads from _sidepath_estimation_* with osm_id and explicit road/path columns.
CREATE FUNCTION tilda_sidepath_dict_checkpoints_and_roads_left_outer_join(buffer_distance float, buffer_size float)
  RETURNS TABLE (
    osm_id bigint,
    nr bigint,
    layer text,
    road_id bigint,
    road_highway text,
    road_name text,
    road_layer text,
    road_maxspeed text
  ) AS $$
  WITH points AS (
    SELECT
      p.osm_id,
      nextval('tilda_sidepath_checkpoint_nr_sequence') AS nr,
      p.layer,
      (tilda_sidepath_dict_interpolated_points($1, p.geom)) AS geom
    FROM
      _sidepath_estimation_paths p
    WHERE
      NOT COALESCE(p.is_crossing, false)
    ORDER BY
      p.osm_id
  )
  SELECT
    points.osm_id,
    points.nr,
    points.layer,
    roads.osm_id AS road_id,
    roads.road AS road_highway,
    roads.name AS road_name,
    roads.layer AS road_layer,
    roads.maxspeed AS road_maxspeed
  FROM
    points
    LEFT OUTER JOIN _sidepath_estimation_roads roads ON ST_DWithin(points.geom, roads.geom, $2)
  ORDER BY
    points.osm_id
$$ LANGUAGE SQL;

CREATE FUNCTION tilda_sidepath_csv(buffer_distance float, buffer_size float)
  RETURNS TABLE (
    osm_id text,
    is_sidepath_estimation text,
    adjoining_road text,
    adjoining_maxspeed text
  ) AS $$
  -- Non-crossings: checkpoint vote (existing estimator).
  SELECT
    j.osm_id::text,
    tilda_sidepath_dict_is_sidepath(j.entry)::text,
    dh.adjoining_road,
    tilda_sidepath_dict_adjoining_maxspeed(j.entry, dh.adjoining_road)
  FROM (
    SELECT
      osm_id,
      tilda_sidepath_dict_agg(nr, layer, road_id, road_highway, road_name, road_layer, road_maxspeed) AS entry
    FROM tilda_sidepath_dict_checkpoints_and_roads_left_outer_join(buffer_distance, buffer_size)
    GROUP BY osm_id
  ) j,
  LATERAL (SELECT tilda_sidepath_dict_dominant_highway(j.entry) AS adjoining_road) dh
  UNION ALL
  -- Crossings: the road this geometry actually intersects (highest class if several arms).
  -- Not a sidepath; traffic islands that hit no centerline stay empty.
  SELECT
    p.osm_id::text,
    'false',
    x.road,
    x.maxspeed
  FROM _sidepath_estimation_paths p
  LEFT JOIN LATERAL (
    SELECT r.road, r.maxspeed
    FROM _sidepath_estimation_roads r
    WHERE ST_Intersects(p.geom, r.geom)
    ORDER BY tilda_sidepath_highway_rank(r.road), r.osm_id
    LIMIT 1
  ) x ON true
  WHERE COALESCE(p.is_crossing, false)
$$ LANGUAGE SQL;

COMMIT;
