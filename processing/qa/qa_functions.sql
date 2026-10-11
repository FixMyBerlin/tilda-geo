/* sql-formatter-disable */
-- WHAT IT DOES:
-- SQL functions for QA (functions only, no data). Loaded once per run via
-- `initializeCustomFunctionsDataTables` (processing/dataTables/dataTables.ts), after
-- processing/measure/measure_functions.sql and before any topic SQL or afterthoughts run.
-- Everything is CREATE OR REPLACE, so re-loading it is harmless.
--
-- * tilda_qa_side_lines: a centerline moved to its street side (bikelanes QA).
-- * tilda_qa_run_dataset: nightly QA for all active prisma."QaConfig" rows of a dataset.
-- * tilda_qa_write_reference: freeze generator, writes a reference table for one config.
--
-- Pipeline per config (internal helpers, all on session temp tables):
--   tilda_qa_prepare_config  -> _qa_ind (indicators), _qa_areas (cells)
--   tilda_qa_measure         -> _qa_current (area_id, indicator_key, value_key, amount)
--   tilda_qa_load_reference  -> _qa_reference (same shape)
--   tilda_qa_compute_indicators() -> one row per (area, indicator) with the metrics
--   tilda_qa_finalize        -> public.<map>, public.<map>_indicators, public.<map>_last_editors
--
-- Every indicator compares the amount per cell (parking spaces, bikelane meters) split by the
-- values of one tag (untagged: '__none__'); the indicator 'total' has the single class '__total__'.
--   difference = max(amount gained, amount lost) over the classes: added, removed or retagged
--   deviation  = difference / max(reference, current); 0 when both are 0
-- Docs: docs/QA-Documentation.md, "Indicators".
--
-- INPUT: temp table _qa_features(geom geometry (5243), amount NUMERIC, tags JSONB,
--        osm_user TEXT, updated_at BIGINT) - the features in their own geometry (point, line or
--        area); a cell gets the share of `amount` that lies inside it (tilda_measure_share).
--        osm_user/updated_at: last OSM editor and edit time (epoch seconds) of the source object.
--        Created by the dataset script
--        (topics/parking/9_qa_parkings.sql, topics/roads_bikelanes/5_qa_bikelanes.sql);
--        prisma."QaConfig"; per config its areaTable (column `geom`) and referenceTable
-- OUTPUT: per config with mapTable = public.<name>:
--         public.<name> (id, geom MultiPolygon 3857), public.<name>_indicators,
--         public.<name>_last_editors (area_id, last_editors JSONB [{osmUser, amount, updatedAt}, ...])
--

-- The line moved sideways by `offset_m` meters (+ left / - right of the line direction), as
-- LineString parts with their share of the total part length (shares sum to 1).
-- Guards: only simple, non-closed lines with an offset are moved (simplified by 0.5 m first, which
-- avoids most MultiLineString results); anything else, or an empty result, returns the input line
-- (share 1).
-- `input_geom` must use a metric SRID (5243).
CREATE OR REPLACE FUNCTION tilda_qa_side_lines(input_geom geometry, offset_m NUMERIC)
RETURNS TABLE(geom geometry, share FLOAT)
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
DECLARE
  moved geometry;
  total FLOAT;
BEGIN
  IF offset_m IS NOT NULL
    AND offset_m <> 0
    AND ST_GeometryType(input_geom) = 'ST_LineString'
    AND ST_IsSimple(input_geom)
    AND NOT ST_IsClosed(input_geom)
  THEN
    moved := ST_OffsetCurve(ST_Simplify(input_geom, 0.5), offset_m::FLOAT);
    SELECT sum(ST_Length(d.geom)) INTO total
    FROM ST_Dump(moved) d
    WHERE ST_GeometryType(d.geom) = 'ST_LineString';
    IF total > 0 THEN
      RETURN QUERY
      SELECT d.geom, ST_Length(d.geom) / total
      FROM ST_Dump(moved) d
      WHERE ST_GeometryType(d.geom) = 'ST_LineString'
        AND ST_Length(d.geom) > 0;
      RETURN;
    END IF;
  END IF;
  RETURN QUERY SELECT input_geom, 1::FLOAT;
END;
$$;

-- Bikelane tags as the QA compares them: a oneway value that was derived or assumed counts like
-- the tagged one. It has the same effect, so tagging it in OSM is not a change to review.
CREATE OR REPLACE FUNCTION tilda_qa_bikelane_tags(tags JSONB)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE tags ->> 'oneway'
    WHEN 'implicit_yes' THEN tags || '{"oneway": "yes"}'
    WHEN 'assumed_no' THEN tags || '{"oneway": "no"}'
    ELSE tags
  END
$$;

-- Internal: 'schema.name' -> {schema, name}, quoting-safe. The config's tables are schema-qualified
-- by contract (zod regex in the admin form), so anything else is a broken config.
CREATE OR REPLACE FUNCTION tilda_qa_split_table(p_table TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parts TEXT[] := parse_ident(p_table);
BEGIN
  IF cardinality(parts) <> 2 THEN
    RAISE EXCEPTION 'QA table must be schema-qualified, got "%"', p_table;
  END IF;
  RETURN parts;
END;
$$;

-- Internal: does the schema-qualified table exist?
CREATE OR REPLACE FUNCTION tilda_qa_table_exists(p_table TEXT)
RETURNS BOOLEAN
LANGUAGE sql
AS $$
  SELECT to_regclass(format('%I.%I', VARIADIC tilda_qa_split_table(p_table))) IS NOT NULL
$$;

-- Bounding box (in `p_srid`) of the cells of all active configs of a dataset, NULL when there is
-- no prisma schema, no active config or no existing area table. Used by the dataset scripts to
-- limit the features they read.
CREATE OR REPLACE FUNCTION tilda_qa_dataset_extent(p_dataset TEXT, p_srid INT)
RETURNS geometry
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  area_table TEXT;
  parts TEXT[];
  box geometry;
  result geometry;
BEGIN
  IF to_regclass('prisma."QaConfig"') IS NULL THEN
    RETURN NULL;
  END IF;

  FOR area_table IN
    SELECT DISTINCT "areaTable" FROM prisma."QaConfig" WHERE dataset = p_dataset AND "isActive"
  LOOP
    CONTINUE WHEN NOT tilda_qa_table_exists(area_table);
    parts := tilda_qa_split_table(area_table);
    EXECUTE format('SELECT ST_SetSRID(ST_Extent(ST_Transform(geom, %s))::geometry, %s) FROM %I.%I', p_srid, p_srid, parts[1], parts[2])
      INTO box;
    result := ST_Envelope(ST_Collect(ARRAY[result, box]));
  END LOOP;

  -- Margin against reprojection error along the cell edges.
  RETURN ST_Expand(result, 100);
END;
$$;

-- Internal: `_qa_ind` from the indicator JSON and `_qa_areas` from the area table.
-- The indicator JSON is validated by the app (zod, qaIndicatorsSchema) before it is stored, so it
-- is trusted here. A missing area table yields no cells (NOTICE), so outputs become empty.
CREATE OR REPLACE PROCEDURE tilda_qa_prepare_config(p_area_table TEXT, p_area_filter TEXT, p_indicators JSONB)
LANGUAGE plpgsql
AS $$
DECLARE
  parts TEXT[] := tilda_qa_split_table(p_area_table);
BEGIN
  DROP TABLE IF EXISTS pg_temp._qa_ind;
  CREATE TEMP TABLE _qa_ind AS
  SELECT e ->> 'key' AS key, NULLIF(e ->> 'key', 'total') AS tag_key
  FROM jsonb_array_elements(p_indicators) AS e;

  DROP TABLE IF EXISTS pg_temp._qa_areas;
  CREATE TEMP TABLE _qa_areas (
    id TEXT PRIMARY KEY,
    geom_3857 geometry(MultiPolygon, 3857),
    geom_5243 geometry(MultiPolygon, 5243)
  );

  IF NOT tilda_qa_table_exists(p_area_table) THEN
    RAISE NOTICE 'QA: missing area table % - no cells for this config', p_area_table;
    RETURN;
  END IF;

  -- Full-precision 5243 geometry is used for containment; 3857 for the map table.
  EXECUTE format(
    $sql$
      INSERT INTO _qa_areas (id, geom_3857, geom_5243)
      SELECT id, ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_Transform(geom, 3857)), 3)), ST_Multi(ST_Transform(geom, 5243))
      FROM (
        SELECT id::TEXT AS id, ST_Multi(ST_CollectionExtract(ST_MakeValid(geom), 3)) AS geom
        FROM %I.%I
        WHERE %s
      ) src
      WHERE NOT ST_IsEmpty(src.geom)
    $sql$,
    parts[1], parts[2],
    CASE p_area_filter
      WHEN 'priority' THEN 'priority IS TRUE'
      WHEN 'non_priority' THEN 'priority IS NOT TRUE'
      -- 'all' and 'with_reference' (narrowed later by tilda_qa_keep_areas_with_reference)
      ELSE 'TRUE'
    END
  );

  CREATE INDEX ON _qa_areas USING GIST (geom_5243);
  ANALYZE _qa_areas;
END;
$$;

-- Internal: the share of every feature per cell (`_qa_features` × `_qa_areas`, kept as
-- `_qa_cell_features` for the last editors), summed per indicator class into `_qa_current`.
CREATE OR REPLACE PROCEDURE tilda_qa_measure()
LANGUAGE plpgsql
AS $$
BEGIN
  DROP TABLE IF EXISTS pg_temp._qa_cell_features;
  CREATE TEMP TABLE _qa_cell_features AS
  SELECT a.id AS area_id, f.amount * s.share::NUMERIC AS amount, f.tags, f.osm_user, f.updated_at
  FROM _qa_areas a
  JOIN _qa_features f ON ST_Intersects(a.geom_5243, f.geom)
  CROSS JOIN LATERAL (SELECT tilda_measure_share(a.geom_5243, f.geom) AS share) s
  WHERE s.share > 0;

  DROP TABLE IF EXISTS pg_temp._qa_current;
  CREATE TEMP TABLE _qa_current AS
  SELECT
    p.area_id,
    i.key AS indicator_key,
    CASE
      WHEN i.tag_key IS NULL THEN '__total__'
      ELSE COALESCE(NULLIF(p.tags ->> i.tag_key, ''), '__none__')
    END AS value_key,
    SUM(p.amount)::NUMERIC AS amount
  FROM _qa_cell_features p
  CROSS JOIN _qa_ind i
  GROUP BY 1, 2, 3;
END;
$$;

-- Internal: the reference table's rows of the configured indicators into `_qa_reference`.
-- Rows are summed per class, so a table without a primary key cannot double-count.
CREATE OR REPLACE PROCEDURE tilda_qa_load_reference(p_reference_table TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  parts TEXT[] := tilda_qa_split_table(p_reference_table);
BEGIN
  DROP TABLE IF EXISTS pg_temp._qa_reference;
  CREATE TEMP TABLE _qa_reference (area_id TEXT, indicator_key TEXT, value_key TEXT, amount NUMERIC);

  IF NOT tilda_qa_table_exists(p_reference_table) THEN
    RAISE NOTICE 'QA: missing reference table % - no indicator rows for this config', p_reference_table;
    RETURN;
  END IF;

  EXECUTE format(
    $sql$
      INSERT INTO _qa_reference
      SELECT area_id::TEXT, indicator_key, value_key, SUM(amount)
      FROM %I.%I
      WHERE indicator_key IN (SELECT key FROM _qa_ind)
      GROUP BY 1, 2, 3
    $sql$,
    parts[1], parts[2]
  );
END;
$$;

-- Internal: for `areaFilter = with_reference`, keep only the cells of `_qa_areas` that have an amount
-- in `_qa_reference`. The outputs are built from `_qa_areas`, so the other cells drop out everywhere.
-- Use it when the reference covers only part of the cell table. It hides everything that is new in
-- a cell that was empty at the freeze.
CREATE OR REPLACE PROCEDURE tilda_qa_keep_areas_with_reference()
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM _qa_areas a
  WHERE NOT EXISTS (SELECT 1 FROM _qa_reference r WHERE r.area_id = a.id AND r.amount > 0);
END;
$$;

-- Internal: the metrics per (area, indicator) from `_qa_areas`, `_qa_ind`, `_qa_current` and
-- `_qa_reference` (one row per class each). One row per area × indicator, also when both sides are
-- empty. An indicator without any reference row (added after the freeze) is left out: comparing it
-- against 0 would rate every cell PROBLEMATIC; the nightly reports it as missing instead.
-- Class amounts are rounded to 0.1 first; all metrics derive from the rounded values.
-- Pure read; tested in qa_functions.test.sql.
-- Dropped first: an earlier version returned another row type, which CREATE OR REPLACE cannot change.
DROP FUNCTION IF EXISTS tilda_qa_compute_indicators();
CREATE OR REPLACE FUNCTION tilda_qa_compute_indicators()
RETURNS TABLE (
  area_id TEXT,
  indicator_key TEXT,
  reference NUMERIC,
  current NUMERIC,
  difference NUMERIC,
  deviation NUMERIC,
  breakdown JSONB
)
LANGUAGE plpgsql
AS $$
-- The OUT columns (area_id, …) share names with the query columns; the query columns win.
#variable_conflict use_column
BEGIN
  RETURN QUERY
  WITH classes AS (
    SELECT
      area_id,
      indicator_key,
      value_key,
      ROUND(COALESCE(ref.amount, 0), 1) AS ref_v,
      ROUND(COALESCE(cur.amount, 0), 1) AS cur_v
    FROM _qa_current cur
    FULL OUTER JOIN _qa_reference ref USING (area_id, indicator_key, value_key)
  ),
  agg AS (
    SELECT
      area_id,
      indicator_key,
      SUM(ref_v) AS reference,
      SUM(cur_v) AS current,
      GREATEST(SUM(GREATEST(cur_v - ref_v, 0)), SUM(GREATEST(ref_v - cur_v, 0))) AS difference,
      jsonb_object_agg(
        value_key,
        jsonb_build_object('reference', trim_scale(ref_v), 'current', trim_scale(cur_v))
      ) FILTER (WHERE ref_v <> 0 OR cur_v <> 0) AS breakdown
    FROM classes
    GROUP BY 1, 2
  )
  SELECT
    a.id,
    i.key,
    trim_scale(COALESCE(agg.reference, 0)),
    trim_scale(COALESCE(agg.current, 0)),
    trim_scale(COALESCE(agg.difference, 0)),
    CASE
      WHEN GREATEST(agg.reference, agg.current) > 0
        THEN trim_scale(ROUND(agg.difference / GREATEST(agg.reference, agg.current), 4))
      ELSE 0
    END,
    -- The total has no classes worth listing.
    CASE WHEN i.tag_key IS NOT NULL THEN COALESCE(agg.breakdown, '{}'::JSONB) END
  FROM _qa_areas a
  CROSS JOIN _qa_ind i
  LEFT JOIN agg ON agg.area_id = a.id AND agg.indicator_key = i.key
  WHERE i.key IN (SELECT r.indicator_key FROM _qa_reference r);
END;
$$;

-- Internal: write the three output tables of a config (contract: docs/QA-Documentation.md).
-- All are plain SQL tables (never osm2pgsql), so `--create` does not wipe them.
CREATE OR REPLACE PROCEDURE tilda_qa_finalize(p_map_table TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  parts TEXT[] := tilda_qa_split_table(p_map_table);
  s TEXT := parts[1];
  n TEXT := parts[2];
BEGIN
  -- Map tables of the single-indicator design carried count_* / relative columns; the table is
  -- rebuilt every run, so dropping it loses nothing.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = s AND table_name = n AND column_name NOT IN ('id', 'geom')
  ) THEN
    RAISE NOTICE 'QA: recreating %.% with the (id, geom) shape', s, n;
    EXECUTE format('DROP TABLE %I.%I', s, n);
  END IF;

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.%I (id TEXT PRIMARY KEY, geom geometry(MultiPolygon, 3857))', s, n);
  -- The value tables hold nothing between runs, so they are rebuilt (which also converges old shapes).
  EXECUTE format('DROP TABLE IF EXISTS %I.%I, %I.%I', s, n || '_indicators', s, n || '_last_editors');
  EXECUTE format(
    $sql$
      CREATE TABLE %I.%I (
        area_id TEXT,
        indicator_key TEXT,
        reference NUMERIC NOT NULL,
        current NUMERIC NOT NULL,
        difference NUMERIC NOT NULL,
        deviation NUMERIC NOT NULL,
        breakdown JSONB,
        PRIMARY KEY (area_id, indicator_key)
      )
    $sql$,
    s, n || '_indicators'
  );
  EXECUTE format('CREATE TABLE %I.%I (area_id TEXT PRIMARY KEY, last_editors JSONB NOT NULL)', s, n || '_last_editors');
  EXECUTE format('TRUNCATE %I.%I', s, n);

  EXECUTE format(
    $sql$
      INSERT INTO %I.%I (area_id, indicator_key, reference, current, difference, deviation, breakdown)
      SELECT * FROM tilda_qa_compute_indicators()
    $sql$,
    s, n || '_indicators'
  );

  -- One row per cell ('[]' without features); one entry per (osm_user, updated_at), not per user,
  -- because the app only counts edits from the reference freeze date on. Newest edit first;
  -- amount in the unit of `_qa_features.amount`, rounded to 0.1.
  EXECUTE format(
    $sql$
      INSERT INTO %I.%I (area_id, last_editors)
      SELECT a.id, COALESCE(e.last_editors, '[]'::JSONB)
      FROM _qa_areas a
      LEFT JOIN (
        SELECT
          area_id,
          jsonb_agg(
            jsonb_build_object('osmUser', osm_user, 'amount', trim_scale(ROUND(amount, 1)), 'updatedAt', updated_at)
            ORDER BY updated_at DESC NULLS LAST, osm_user NULLS LAST
          ) AS last_editors
        FROM (
          SELECT area_id, osm_user, updated_at, SUM(amount) AS amount
          FROM _qa_cell_features
          GROUP BY 1, 2, 3
          -- An editor whose feature only grazes the cell did not change it.
          HAVING ROUND(SUM(amount), 1) > 0
        ) edits
        GROUP BY area_id
      ) e ON e.area_id = a.id
    $sql$,
    s, n || '_last_editors'
  );

  -- Cells: the map shows the geometry the measure uses.
  EXECUTE format('INSERT INTO %I.%I (id, geom) SELECT id, geom_3857 FROM _qa_areas', s, n);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.%I USING GIST (geom)', n || '_geom_idx', s, n);
END;
$$;

-- Nightly QA for all active configs of a dataset.
-- Precondition: temp table `_qa_features` (see header) exists.
-- No prisma schema (CI, fresh DBs) -> NOTICE and return.
-- A failing config is rolled back and reported as WARNING; the other configs and the nightly continue.
CREATE OR REPLACE PROCEDURE tilda_qa_run_dataset(p_dataset TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  cfg RECORD;
BEGIN
  IF to_regclass('prisma."QaConfig"') IS NULL THEN
    RAISE NOTICE 'QA %: no prisma."QaConfig" table - skipping', p_dataset;
    RETURN;
  END IF;

  ANALYZE _qa_features;

  FOR cfg IN
    SELECT id, "mapTable" AS map_table, "areaTable" AS area_table, "areaFilter"::TEXT AS area_filter,
      "referenceTable" AS reference_table, indicators::JSONB AS indicators
    FROM prisma."QaConfig"
    WHERE dataset = p_dataset AND "isActive"
    ORDER BY id
  LOOP
    BEGIN
      CALL tilda_qa_prepare_config(cfg.area_table, cfg.area_filter, cfg.indicators);
      CALL tilda_qa_load_reference(cfg.reference_table);
      IF cfg.area_filter = 'with_reference' THEN
        CALL tilda_qa_keep_areas_with_reference();
      END IF;
      CALL tilda_qa_measure();
      CALL tilda_qa_finalize(cfg.map_table);
      RAISE NOTICE 'QA % config % (%): % cells, done at %',
        p_dataset, cfg.id, cfg.map_table, (SELECT count(*) FROM _qa_areas), clock_timestamp() AT TIME ZONE 'Europe/Berlin';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'QA % config % (%) FAILED and was rolled back: % (SQLSTATE %)',
        p_dataset, cfg.id, cfg.map_table, SQLERRM, SQLSTATE;
    END;
  END LOOP;
END;
$$;

-- Freeze generator (MANUAL ONLY, run at delivery; see docs/Parking-Client-Freeze-QA.md):
-- writes the reference table for one config (area_id, indicator_key, value_key, amount).
-- Precondition: temp table `_qa_features` (see header; osm_user/updated_at may be NULL) exists in this
-- session — build it exactly like the dataset script does (topics/parking/9_qa_parkings.sql, topics/roads_bikelanes/5_qa_bikelanes.sql), or
-- from a freeze backup of the features. Does not require the config to be active.
-- Fails if the target exists or the config has no cells.
--
--   CALL tilda_qa_write_reference('bikelanes', 5, 'data.qa_bikelanes_berlin_reference_2026');
CREATE OR REPLACE PROCEDURE tilda_qa_write_reference(p_dataset TEXT, p_config_id INT, p_target_table TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  cfg RECORD;
  parts TEXT[] := tilda_qa_split_table(p_target_table);
BEGIN
  SELECT "areaTable" AS area_table, "areaFilter"::TEXT AS area_filter, indicators::JSONB AS indicators
  INTO cfg
  FROM prisma."QaConfig"
  WHERE id = p_config_id AND dataset = p_dataset;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No QaConfig id=% with dataset=%', p_config_id, p_dataset;
  END IF;
  IF tilda_qa_table_exists(p_target_table) THEN
    RAISE EXCEPTION 'Target % already exists - pick a new name or DROP it first', p_target_table;
  END IF;

  CALL tilda_qa_prepare_config(cfg.area_table, cfg.area_filter, cfg.indicators);
  IF NOT EXISTS (SELECT 1 FROM _qa_areas) THEN
    RAISE EXCEPTION 'Config % has no cells in % (%)', p_config_id, cfg.area_table, cfg.area_filter;
  END IF;
  ANALYZE _qa_features;
  CALL tilda_qa_measure();

  EXECUTE format(
    'CREATE TABLE %I.%I (area_id TEXT, indicator_key TEXT, value_key TEXT, amount NUMERIC, PRIMARY KEY (area_id, indicator_key, value_key))',
    parts[1], parts[2]
  );
  EXECUTE format('INSERT INTO %I.%I SELECT * FROM _qa_current ORDER BY 1, 2, 3', parts[1], parts[2]);
  RAISE NOTICE 'Created % from config %: % cells, % rows',
    p_target_table, p_config_id, (SELECT count(*) FROM _qa_areas), (SELECT count(*) FROM _qa_current);
END;
$$;
