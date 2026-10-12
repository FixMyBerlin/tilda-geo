/* sql-formatter-disable */
-- Tests for processing/measure/measure_functions.sql and processing/qa/qa_functions.sql (assert-style DO blocks; the first failure raises).
-- There is no SQL test runner in the repo (`bun run test` only runs busted for Lua), so run it by hand
-- against any PostGIS DB. Everything runs in one transaction that is rolled back, so it leaves nothing
-- behind (functions included):
--
--   { echo 'BEGIN;'; cat processing/measure/measure_functions.sql processing/qa/qa_functions.sql processing/qa/qa_functions.test.sql; echo 'ROLLBACK;'; } \
--     | docker exec -i <db-container> psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q
--
-- Expected output ends with: NOTICE:  qa_functions.test.sql: all tests passed
-- tilda_qa_run_dataset / tilda_qa_write_reference / tilda_qa_dataset_extent need prisma."QaConfig" and
-- are covered by the processing run instead; the steps they call are tested here.
-- Needs a `data` schema (every TILDA DB has one).

CREATE FUNCTION pg_temp.assert_eq(actual ANYELEMENT, expected ANYELEMENT, label TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL %: expected %, got %', label, expected, actual;
  END IF;
END;
$$;

-- tilda_measure_share ----------------------------------------------------------------------------
DO $$
DECLARE
  cell geometry := ST_MakeEnvelope(0, 0, 10, 10, 5243);
  neighbour geometry := ST_MakeEnvelope(10, 0, 20, 10, 5243);
BEGIN
  PERFORM pg_temp.assert_eq(tilda_measure_share(cell, ST_GeomFromText('POINT(5 5)', 5243)), 1::FLOAT, 'share: point inside');
  PERFORM pg_temp.assert_eq(tilda_measure_share(cell, ST_GeomFromText('POINT(15 5)', 5243)), 0::FLOAT, 'share: point outside');
  PERFORM pg_temp.assert_eq(
    tilda_measure_share(cell, ST_GeomFromText('POINT(10 5)', 5243)) + tilda_measure_share(neighbour, ST_GeomFromText('POINT(10 5)', 5243)),
    2::FLOAT, 'share: point on the border counts for both cells');
  PERFORM pg_temp.assert_eq(tilda_measure_share(cell, ST_GeomFromText('LINESTRING(7 5, 17 5)', 5243)), 0.3::FLOAT, 'share: line by length');
  PERFORM pg_temp.assert_eq(
    tilda_measure_share(cell, ST_GeomFromText('LINESTRING(7 5, 17 5)', 5243)) + tilda_measure_share(neighbour, ST_GeomFromText('LINESTRING(7 5, 17 5)', 5243)),
    1::FLOAT, 'share: a line split over two cells adds up to 1');
  PERFORM pg_temp.assert_eq(tilda_measure_share(cell, ST_GeomFromText('LINESTRING(10 5, 17 5)', 5243)), 0::FLOAT, 'share: line only touching');
  PERFORM pg_temp.assert_eq(tilda_measure_share(cell, ST_GeomFromText('MULTILINESTRING((8 1, 12 1), (12 2, 18 2))', 5243)), 0.2::FLOAT, 'share: multi line by total length');
  PERFORM pg_temp.assert_eq(tilda_measure_share(cell, ST_MakeEnvelope(8, 0, 16, 10, 5243)), 0.25::FLOAT, 'share: area by area');
END $$;

-- tilda_qa_side_lines ----------------------------------------------------------------------------
DO $$
DECLARE
  line geometry := ST_GeomFromText('LINESTRING(0 0, 10 0)', 5243);
  -- Simple line whose +3 m offset splits into two closed parts (16 m each)
  pocket geometry := ST_GeomFromText('LINESTRING(0 0, 20 0, 20 10, 10 10, 10 1, 9 1, 9 10, 0 10)', 5243);
BEGIN
  -- + left / - right (the line runs east, so left is north)
  PERFORM pg_temp.assert_eq(
    (SELECT format('%s/%s/%s', count(*), sum(share), ST_AsText(ST_Envelope(ST_Collect(geom)))) FROM tilda_qa_side_lines(line, 2)),
    '1/1/LINESTRING(0 2,10 2)', 'side lines: + goes left');
  PERFORM pg_temp.assert_eq(
    (SELECT format('%s/%s/%s', count(*), sum(share), ST_AsText(ST_Envelope(ST_Collect(geom)))) FROM tilda_qa_side_lines(line, -2.5)),
    '1/1/LINESTRING(0 -2.5,10 -2.5)', 'side lines: - goes right');
  -- 5_qa_bikelanes.sql: a left-side line (offset +2) is reversed on import (roads_bikelanes_bikelanes.lua) and moved
  -- by -|offset|, which lands where +2 on the unreversed line would.
  PERFORM pg_temp.assert_eq(
    (SELECT ST_AsText(ST_Envelope(geom)) FROM tilda_qa_side_lines(ST_Reverse(line), - ABS(2::NUMERIC))),
    'LINESTRING(0 2,10 2)', 'side lines: reversed left line, -|offset| -> left of the way');
  -- centerline fallbacks
  PERFORM pg_temp.assert_eq((SELECT ST_Equals(geom, line) AND share = 1 FROM tilda_qa_side_lines(line, NULL)), TRUE, 'no offset -> centerline');
  PERFORM pg_temp.assert_eq(
    (SELECT count(*) FROM tilda_qa_side_lines(ST_GeomFromText('LINESTRING(0 0, 10 0, 10 10, 0 0)', 5243), 2)
      WHERE ST_Equals(geom, ST_GeomFromText('LINESTRING(0 0, 10 0, 10 10, 0 0)', 5243)) AND share = 1),
    1::BIGINT, 'closed line -> centerline');
  PERFORM pg_temp.assert_eq(
    (SELECT count(*) FROM tilda_qa_side_lines(ST_GeomFromText('LINESTRING(0 0, 10 0, 10 5, 5 -5)', 5243), 2)
      WHERE ST_Equals(geom, ST_GeomFromText('LINESTRING(0 0, 10 0, 10 5, 5 -5)', 5243)) AND share = 1),
    1::BIGINT, 'self-intersecting line -> centerline');
  PERFORM pg_temp.assert_eq(
    (SELECT count(*) FROM tilda_qa_side_lines(ST_GeomFromText('LINESTRING(0 0, 10 0, 10 4, 2 4, 2 1)', 5243), 3)
      WHERE ST_Equals(geom, ST_GeomFromText('LINESTRING(0 0, 10 0, 10 4, 2 4, 2 1)', 5243)) AND share = 1),
    1::BIGINT, 'empty offset result -> centerline');
  -- multi-part: shares by part length, the length is not double-counted
  PERFORM pg_temp.assert_eq(
    (SELECT format('%s/%s', count(*), string_agg(share::TEXT, ',')) FROM tilda_qa_side_lines(pocket, 3)),
    '2/0.5,0.5', 'multi-part: two parts, shares by part length');
END $$;

-- Fixture: cells + features ----------------------------------------------------------------------
-- Cells (4326, like data.euvm_qa_voronoi_2026): A, B non-priority, C priority, D degenerate (dropped)
CREATE TABLE data.qa_test_fixture_areas (
  id TEXT PRIMARY KEY,
  priority BOOLEAN,
  geom geometry(MultiPolygon, 4326)
);
INSERT INTO data.qa_test_fixture_areas (id, priority, geom) VALUES
  ('A', FALSE, ST_Multi(ST_MakeEnvelope(13.400, 52.500, 13.401, 52.501, 4326))),
  ('B', NULL, ST_Multi(ST_MakeEnvelope(13.402, 52.500, 13.403, 52.501, 4326))),
  ('C', TRUE, ST_Multi(ST_MakeEnvelope(13.404, 52.500, 13.405, 52.501, 4326))),
  ('D', FALSE, ST_Multi(ST_GeomFromText('POLYGON((13.406 52.5, 13.407 52.5, 13.408 52.5, 13.406 52.5))', 4326)));

CREATE TEMP TABLE _qa_features (geom geometry(Geometry, 5243), amount NUMERIC, tags JSONB, osm_user TEXT, updated_at BIGINT);
INSERT INTO _qa_features (geom, amount, tags, osm_user, updated_at)
SELECT ST_Transform(ST_SetSRID(ST_MakePoint(lon, lat), 4326), 5243), amount, tags::JSONB, osm_user, updated_at
FROM (VALUES
  (13.4005, 52.5005, 10, '{"surface":"asphalt"}', 'alice', 200),
  (13.4003, 52.5003, 5, '{"surface":"asphalt"}', 'alice', 300),
  (13.4007, 52.5007, 5, '{"surface":"paving_stones"}', 'alice', 200),
  (13.4006, 52.5006, 3, '{"surface":""}', 'alice', 200),         -- empty value -> untagged
  (13.4025, 52.5005, 2, '{"surface":"asphalt"}', NULL, NULL),     -- editor unknown
  (13.4045, 52.5005, 7, '{"surface":"asphalt"}', 'bob', 400),    -- in C (priority, filtered out)
  (13.4100, 52.5100, 99, '{"surface":"asphalt"}', 'bob', 500)    -- outside every cell
) AS v(lon, lat, amount, tags, osm_user, updated_at);

-- Lines that leave their cell through the middle of its north edge (nothing lies north of the cells).
-- The cell edges are straight in 5243, so `share` of the line is inside the cell.
CREATE FUNCTION pg_temp.point_5243(lon FLOAT, lat FLOAT)
RETURNS geometry LANGUAGE sql AS $$
  SELECT ST_Transform(ST_SetSRID(ST_MakePoint(lon, lat), 4326), 5243)
$$;
CREATE FUNCTION pg_temp.line_crossing_north_edge(west FLOAT, share FLOAT)
RETURNS geometry LANGUAGE sql AS $$
  SELECT ST_MakeLine(
    inside,
    ST_Translate(inside, (ST_X(edge) - ST_X(inside)) / share, (ST_Y(edge) - ST_Y(inside)) / share))
  FROM (SELECT
    pg_temp.point_5243(west + 0.0005, 52.5005) AS inside,
    ST_LineInterpolatePoint(ST_MakeLine(pg_temp.point_5243(west, 52.501), pg_temp.point_5243(west + 0.001, 52.501)), 0.5) AS edge
  ) cell
$$;
INSERT INTO _qa_features (geom, amount, tags, osm_user, updated_at) VALUES
  (pg_temp.line_crossing_north_edge(13.400, 0.25), 10, '{"surface":"asphalt"}', 'carol', 250),  -- 2.5 in A
  (pg_temp.line_crossing_north_edge(13.402, 0.04), 1, '{"surface":"asphalt"}', 'dave', 600);    -- 0.04 in B: grazes it
CREATE INDEX ON _qa_features USING GIST (geom);

-- prepare + measure, area filters
DO $$
BEGIN
  CALL tilda_qa_prepare_config('data.qa_test_fixture_areas', 'non_priority', '[{"key":"total"},{"key":"surface"}]');
  PERFORM pg_temp.assert_eq((SELECT string_agg(id, ',' ORDER BY id) FROM _qa_areas), 'A,B', 'areas: non_priority, degenerate dropped');
  PERFORM pg_temp.assert_eq((SELECT string_agg(format('%s:%s', key, tag_key), ',') FROM _qa_ind), 'total:,surface:surface', 'indicators: total has no tag');

  CALL tilda_qa_measure();
  PERFORM pg_temp.assert_eq(
    (SELECT string_agg(format('%s/%s/%s=%s', area_id, indicator_key, value_key, trim_scale(ROUND(amount, 3))), ' ' ORDER BY area_id, indicator_key, value_key COLLATE "C") FROM _qa_current),
    'A/surface/__none__=3 A/surface/asphalt=17.5 A/surface/paving_stones=5 A/total/__total__=25.5 B/surface/asphalt=2.04 B/total/__total__=2.04',
    'measure current: points whole, lines by their share inside the cell');

  CALL tilda_qa_prepare_config('data.qa_test_fixture_areas', 'priority', '[{"key":"total"}]');
  PERFORM pg_temp.assert_eq((SELECT string_agg(id, ',' ORDER BY id) FROM _qa_areas), 'C', 'areas: priority');
  CALL tilda_qa_prepare_config('data.qa_test_fixture_areas', 'all', '[{"key":"total"}]');
  PERFORM pg_temp.assert_eq((SELECT string_agg(id, ',' ORDER BY id) FROM _qa_areas), 'A,B,C', 'areas: all');
  CALL tilda_qa_prepare_config('data.qa_test_missing_areas', 'all', '[{"key":"total"}]');
  PERFORM pg_temp.assert_eq((SELECT count(*) FROM _qa_areas), 0::BIGINT, 'areas: missing table -> empty');
END $$;

-- Reference ---------------------------------------------------------------------------------------
CREATE TABLE data.qa_test_fixture_reference (area_id TEXT, indicator_key TEXT, value_key TEXT, amount NUMERIC);
INSERT INTO data.qa_test_fixture_reference VALUES
  ('A', 'total', '__total__', 23),
  ('A', 'surface', 'asphalt', 20),
  ('A', 'surface', '__none__', 3),
  ('B', 'total', '__total__', 4),
  ('B', 'surface', 'asphalt', 2),
  ('B', 'removed_indicator', 'x', 50),   -- not in the config -> ignored
  ('Z', 'total', '__total__', 50),       -- not a cell -> ignored
  ('B', 'total', '__total__', 0);        -- duplicate class row (no primary key) -> summed

-- load_reference + finalize -----------------------------------------------------------------------
-- Old single-indicator shape: must be converged to (id, geom)
CREATE TABLE public.qa_test_fixture (id TEXT PRIMARY KEY, geom geometry(MultiPolygon, 3857), count_reference INTEGER);

DO $$
BEGIN
  CALL tilda_qa_prepare_config('data.qa_test_fixture_areas', 'non_priority', '[{"key":"total"},{"key":"surface"}]');
  CALL tilda_qa_measure();
  CALL tilda_qa_load_reference('data.qa_test_fixture_reference');
  PERFORM pg_temp.assert_eq((SELECT count(*) FROM _qa_reference), 6::BIGINT, 'reference filtered to config indicators, summed per class');

  CALL tilda_qa_finalize('public.qa_test_fixture');

  PERFORM pg_temp.assert_eq(
    (SELECT array_agg(column_name::TEXT ORDER BY column_name) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'qa_test_fixture'),
    ARRAY['geom', 'id'], 'map table converged to (id, geom)');
  PERFORM pg_temp.assert_eq((SELECT count(*) FROM public.qa_test_fixture), 2::BIGINT, 'map table rows');
  PERFORM pg_temp.assert_eq(
    (SELECT jsonb_object_agg(area_id, last_editors) FROM public.qa_test_fixture_last_editors),
    '{"A":[{"osmUser":"alice","amount":5,"updatedAt":300},{"osmUser":"carol","amount":2.5,"updatedAt":250},{"osmUser":"alice","amount":18,"updatedAt":200}],
      "B":[{"osmUser":null,"amount":2,"updatedAt":null}]}'::JSONB,
    'last editors: per (user, time) pair, newest first, without the grazing dave');
  PERFORM pg_temp.assert_eq(
    (SELECT string_agg(format('%s/%s ref=%s cur=%s diff=%s dev=%s', area_id, indicator_key, reference, current, difference, deviation),
        ' | ' ORDER BY area_id, indicator_key)
      FROM public.qa_test_fixture_indicators),
    'A/surface ref=23 cur=25.5 diff=5 dev=0.1961 | A/total ref=23 cur=25.5 diff=2.5 dev=0.098'
      || ' | B/surface ref=2 cur=2 diff=0 dev=0 | B/total ref=4 cur=2 diff=2 dev=0.5',
    'indicators');
  PERFORM pg_temp.assert_eq(
    (SELECT breakdown FROM public.qa_test_fixture_indicators WHERE area_id = 'A' AND indicator_key = 'surface'),
    '{"__none__":{"reference":3,"current":3},"asphalt":{"reference":20,"current":17.5},"paving_stones":{"reference":0,"current":5}}'::JSONB,
    'breakdown per tag value');
  PERFORM pg_temp.assert_eq(
    (SELECT breakdown FROM public.qa_test_fixture_indicators WHERE area_id = 'A' AND indicator_key = 'total'),
    NULL::JSONB, 'total has no breakdown');

  -- second run replaces the rows; a cell that is only grazed still gets '[]' editors
  DELETE FROM _qa_features WHERE osm_user IS NULL;
  CALL tilda_qa_measure();
  CALL tilda_qa_finalize('public.qa_test_fixture');
  PERFORM pg_temp.assert_eq((SELECT count(*) FROM public.qa_test_fixture_indicators), 4::BIGINT, 'second run: rows replaced');
  PERFORM pg_temp.assert_eq(
    (SELECT last_editors FROM public.qa_test_fixture_last_editors WHERE area_id = 'B'), '[]'::JSONB, 'last editors: only grazed -> []');

  -- an indicator without reference rows is left out (not compared against 0)
  DELETE FROM _qa_reference WHERE indicator_key = 'surface';
  PERFORM pg_temp.assert_eq(
    (SELECT string_agg(DISTINCT indicator_key, ',') FROM tilda_qa_compute_indicators()), 'total', 'unreferenced indicator left out');
  CALL tilda_qa_load_reference('data.qa_test_missing_reference');
  PERFORM pg_temp.assert_eq(to_regclass('data.qa_test_missing_reference') IS NULL, TRUE, 'missing reference: no table created');
  PERFORM pg_temp.assert_eq((SELECT count(*) FROM tilda_qa_compute_indicators()), 0::BIGINT, 'missing reference -> no rows');
END $$;

-- The comparison on hand-filled temp tables -------------------------------------------------------
DO $$
BEGIN
  DROP TABLE pg_temp._qa_areas, pg_temp._qa_ind, pg_temp._qa_current, pg_temp._qa_reference;
  CREATE TEMP TABLE _qa_areas (id TEXT PRIMARY KEY, geom_3857 geometry(MultiPolygon, 3857), geom_5243 geometry(MultiPolygon, 5243));
  INSERT INTO _qa_areas (id) VALUES ('both0'), ('ref0'), ('cur0'), ('more'), ('less'), ('tiny'), ('mixed'), ('empty');
  CREATE TEMP TABLE _qa_ind (key TEXT, tag_key TEXT);
  INSERT INTO _qa_ind VALUES ('total', NULL), ('surface', 'surface');
  CREATE TEMP TABLE _qa_current (area_id TEXT, indicator_key TEXT, value_key TEXT, amount NUMERIC);
  CREATE TEMP TABLE _qa_reference (area_id TEXT, indicator_key TEXT, value_key TEXT, amount NUMERIC);
  INSERT INTO _qa_current VALUES
    ('ref0', 'total', '__total__', 5),
    ('more', 'total', '__total__', 25),
    ('less', 'total', '__total__', 20),
    ('tiny', 'total', '__total__', 0.04),
    ('tiny', 'surface', 'asphalt', 12.345),
    ('tiny', 'surface', 'sett', 0.02),
    ('mixed', 'surface', 'asphalt', 5),
    ('mixed', 'surface', 'sett', 10);
  INSERT INTO _qa_reference VALUES
    ('cur0', 'total', '__total__', 5),
    ('more', 'total', '__total__', 20),
    ('less', 'total', '__total__', 25),
    ('tiny', 'surface', 'asphalt', 12.3),
    ('mixed', 'surface', 'asphalt', 10);

  PERFORM pg_temp.assert_eq(
    (SELECT string_agg(format('%s=%s/%s/%s/%s', area_id, reference, current, difference, deviation), ' ' ORDER BY area_id)
      FROM tilda_qa_compute_indicators() WHERE indicator_key = 'total'),
    'both0=0/0/0/0 cur0=5/0/5/1 empty=0/0/0/0 less=25/20/5/0.2 mixed=0/0/0/0 more=20/25/5/0.2 ref0=0/5/5/1 tiny=0/0/0/0',
    'total: |ref - cur| / max, rounding to 0.1');
  -- 5 m asphalt lost, 10 m sett gained: 10 m to add, remove or retag, of 15 m
  PERFORM pg_temp.assert_eq(
    (SELECT format('%s/%s/%s/%s', reference, current, difference, deviation)
      FROM tilda_qa_compute_indicators() WHERE indicator_key = 'surface' AND area_id = 'mixed'),
    '10/15/10/0.6667', 'split by tag: max(gained, lost) / max(reference, current)');
  PERFORM pg_temp.assert_eq(
    (SELECT format('%s/%s/%s/%s/%s', reference, current, difference, deviation, breakdown)
      FROM tilda_qa_compute_indicators() WHERE indicator_key = 'surface' AND area_id = 'tiny'),
    '12.3/12.3/0/0/{"asphalt": {"current": 12.3, "reference": 12.3}}',
    'split by tag: rounding 12.345 -> 12.3, 0.02 class dropped');
  PERFORM pg_temp.assert_eq(
    (SELECT breakdown FROM tilda_qa_compute_indicators() WHERE indicator_key = 'surface' AND area_id = 'empty'),
    '{}'::JSONB, 'split by tag without classes -> {}');
  PERFORM pg_temp.assert_eq((SELECT count(*) FROM tilda_qa_compute_indicators()), 16::BIGINT, 'one row per area x indicator');

  -- areaFilter with_reference: cells without a reference amount drop out (ref0 has only current)
  CALL tilda_qa_keep_areas_with_reference();
  PERFORM pg_temp.assert_eq(
    (SELECT string_agg(id, ',' ORDER BY id) FROM _qa_areas), 'cur0,less,mixed,more,tiny', 'areas: with_reference');
  PERFORM pg_temp.assert_eq((SELECT count(*) FROM tilda_qa_compute_indicators()), 10::BIGINT, 'with_reference: rows only for kept cells');
END $$;

DO $$ BEGIN RAISE NOTICE 'qa_functions.test.sql: all tests passed'; END $$;
