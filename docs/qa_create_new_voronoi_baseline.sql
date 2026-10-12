-- MANUAL ONLY — not part of nightly processing.
--
-- What this script still does: build a new data.* CELL table (id, geom, name, priority) from an
-- existing one, clipped and validated against Berlin. This is the only recipe we have for
-- clipping/validating a cell table, so it stays, trimmed down.
--
-- It does not compute reference values. Those live in a separate long-format `data.*` reference
-- table per config, written with the QA functions (processing/qa/qa_functions.sql) — see
-- docs/Parking-Client-Freeze-QA.md. The cell table produced here only needs `id` + `geom`
-- (+ optional `name` / `priority`).
--
-- Run this only when the CELL SET itself needs to change (a new priority split, a new provider
-- export, or clipping a not-yet-clipped table to Berlin for the first time). Reusing an existing,
-- already-clipped cell table (e.g. data.euvm_qa_voronoi_2026) needs none of this — go straight to
-- tilda_qa_write_reference.
--
-- Run on production (same DB that will feed nightly QA): edit the variables in the DECLARE
-- block, then run the whole script.
--
-- Everything that happens before and after this (SQL dump export, spec, load/verify, straightening
-- the cell borders, publish, Import) is documented once in docs/Parking-Client-Freeze-QA.md —
-- follow that.

CREATE SCHEMA IF NOT EXISTS data;

DO $$
DECLARE
  -- >>> EDIT THESE
  base_table text := 'euvm_qa_voronoi'; -- existing data.* polygons + priority
  target_table text := 'euvm_qa_voronoi_2026'; -- new data.* baseline (must not exist yet)
  -- <<<
  base_rows bigint;
  target_rows bigint;
  dropped bigint;
  n_invalid bigint;
  n_clipped bigint;
  berlin_exists boolean;
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

  SELECT EXISTS (
    SELECT 1 FROM public.boundaries WHERE osm_id = 62422
  ) INTO berlin_exists;
  IF NOT berlin_exists THEN
    RAISE EXCEPTION 'Missing public.boundaries row osm_id = 62422 (Berlin); refusing to clip';
  END IF;

  EXECUTE format(
    $sql$
      SELECT
        count(*) FILTER (WHERE NOT public.ST_IsValid(src.geom)),
        count(*) FILTER (
          WHERE NOT public.ST_Within(src.geom, public.ST_Transform(berlin.geom, 4326))
        )
      FROM data.%I src
      CROSS JOIN public.boundaries berlin
      WHERE berlin.osm_id = 62422
    $sql$,
    base_table
  ) INTO n_invalid, n_clipped;

  RAISE NOTICE 'Base data.%: invalid=%, not_within_berlin=%', base_table, n_invalid, n_clipped;

  EXECUTE format(
    $sql$
      CREATE TABLE data.%I (
        id TEXT PRIMARY KEY,
        geom public.geometry (MultiPolygon, 4326),
        name varchar,
        priority boolean
      )
    $sql$,
    target_table
  );

  -- Always ST_Intersection (34k rows, once, manual). ST_Intersection of a cell
  -- already within Berlin is a no-op on the polygon; CollectionExtract keeps it polygonal.
  EXECUTE format(
    $sql$
      INSERT INTO data.%I (id, geom, name, priority)
      SELECT
        b.id::TEXT,
        clipped.geom,
        b.name,
        b.priority
      FROM
        data.%I b
        CROSS JOIN public.boundaries berlin
        CROSS JOIN LATERAL (
          SELECT
            public.ST_Multi(
              public.ST_CollectionExtract(
                public.ST_Intersection(
                  public.ST_MakeValid(b.geom),
                  public.ST_Transform(berlin.geom, 4326)
                ),
                3
              )
            ) AS geom
        ) clipped
      WHERE
        berlin.osm_id = 62422
        AND NOT public.ST_IsEmpty(clipped.geom)
    $sql$,
    target_table,
    base_table
  );

  EXECUTE format('SELECT count(*) FROM data.%I', base_table) INTO base_rows;
  EXECUTE format('SELECT count(*) FROM data.%I', target_table) INTO target_rows;

  dropped := base_rows - target_rows;
  -- Empty-after-clip cells are dropped on purpose (4 on the 2026 vintage).
  -- 50 is a sanity cap so a broken clip cannot silently wipe the table.
  IF target_rows > base_rows THEN
    RAISE EXCEPTION 'Target has more rows than base: base=% target=%', base_rows, target_rows;
  END IF;
  IF dropped > 50 THEN
    RAISE EXCEPTION 'Dropped % cells (base=% target=%); sanity cap is 50', dropped, base_rows, target_rows;
  END IF;

  RAISE NOTICE 'Created data.%: rows=%, dropped=% (base data.% was rows=%)',
    target_table, target_rows, dropped, base_table, base_rows;
END $$;
