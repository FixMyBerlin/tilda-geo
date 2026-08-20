-- MANUAL ONLY — not part of nightly processing.
--
-- Create a new data.* QA voronoi baseline from live public.*_quantized points.
-- Copies id / geom / name / priority from an existing base table; recalculates count_reference.
--
-- Run on production at freeze / delivery time (same DB that will feed nightly QA).
--
-- 1. Edit the variables in the DECLARE block
-- 2. Run the whole script (psql, TablePlus, …)
-- 3. Point processing step 9 at the new target table name if it changed
--    (public outputs stay qa_parkings_euvm / qa_parkings_euvm_priority)
-- 4. Copy data.<target_table> to local Postgres, then
--    bun run data-schema-publish (CLI only; not the admin page) so staging
--    and other machines can Import it. Use --mode snapshot to keep the
--    previous dump. Also publish the undated base table data.euvm_qa_voronoi
--    once so the generator can be re-run outside production.

CREATE SCHEMA IF NOT EXISTS data;

DO $$
DECLARE
  -- >>> EDIT THESE
  base_table text := 'euvm_qa_voronoi'; -- existing data.* polygons + priority
  target_table text := 'euvm_qa_voronoi_2026'; -- new data.* baseline (must not exist yet)
  -- <<<
  base_rows bigint;
  target_rows bigint;
  target_ref_sum bigint;
  base_ref_sum bigint;
BEGIN
  -- GUI clients often omit PostGIS from search_path; pin it for this block.
  PERFORM set_config('search_path', 'public, data, pg_temp', true);

  IF base_table !~ '^[a-z][a-z0-9_]*$' OR target_table !~ '^[a-z][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Table names must be lowercase snake_case';
  END IF;

  IF base_table = target_table THEN
    RAISE EXCEPTION 'base_table and target_table must differ';
  END IF;

  IF to_regclass(format('data.%I', base_table)) IS NULL THEN
    RAISE EXCEPTION 'Missing data.%', base_table;
  END IF;

  IF to_regclass(format('data.%I', target_table)) IS NOT NULL THEN
    RAISE EXCEPTION 'Target data.% already exists — pick a new name or DROP it first', target_table;
  END IF;

  -- Same point filter as processing/topics/parking/9_qa_parkings_euvm_voronoi.sql
  DROP TABLE IF EXISTS _qa_voronoi_baseline_points;
  CREATE TEMP TABLE _qa_voronoi_baseline_points AS
  SELECT
    public.ST_Transform(geom, 5243) AS geom
  FROM
    public.parkings_quantized
  WHERE
    tags ->> 'operator_type' IS NULL
    OR tags ->> 'operator_type' <> 'private'
  UNION ALL
  SELECT
    public.ST_Transform(geom, 5243) AS geom
  FROM
    public.off_street_parking_quantized
  WHERE
    tags ->> 'operator_type' = 'public';

  CREATE INDEX _qa_voronoi_baseline_points_geom_idx ON _qa_voronoi_baseline_points USING GIST (geom);

  EXECUTE format(
    $sql$
      CREATE TABLE data.%I (
        id TEXT PRIMARY KEY,
        geom public.geometry (MultiPolygon, 4326),
        name varchar,
        count_reference smallint,
        priority boolean
      )
    $sql$,
    target_table
  );

  EXECUTE format(
    $sql$
      INSERT INTO data.%I (id, geom, name, priority, count_reference)
      SELECT
        b.id::TEXT,
        b.geom,
        b.name,
        b.priority,
        LEAST(COALESCE(c.cnt, 0), 32767)::SMALLINT AS count_reference
      FROM
        data.%I b
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::INTEGER AS cnt
          FROM
            _qa_voronoi_baseline_points p
          WHERE
            public.ST_Contains(public.ST_Transform(b.geom, 5243), p.geom)
        ) c ON TRUE
    $sql$,
    target_table,
    base_table
  );

  EXECUTE format('SELECT count(*) FROM data.%I', base_table) INTO base_rows;
  EXECUTE format('SELECT COALESCE(SUM(count_reference), 0) FROM data.%I', base_table) INTO base_ref_sum;
  EXECUTE format('SELECT count(*) FROM data.%I', target_table) INTO target_rows;
  EXECUTE format('SELECT COALESCE(SUM(count_reference), 0) FROM data.%I', target_table) INTO target_ref_sum;

  IF target_rows <> base_rows THEN
    RAISE EXCEPTION 'Row count mismatch: base=% target=%', base_rows, target_rows;
  END IF;

  RAISE NOTICE 'Created data.%: rows=%, sum(count_reference)=% (base data.% was sum=%)', target_table, target_rows, target_ref_sum, base_table, base_ref_sum;
END $$;
