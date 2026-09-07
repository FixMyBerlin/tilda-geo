-- MANUAL ONLY — not part of nightly processing.
--
-- Create a new data.* QA voronoi baseline from live public.*_quantized points.
-- Copies id / name / priority from an existing base table; normalizes geom to
-- valid MultiPolygon, clips to Berlin (osm_id 62422), drops cells that clip to
-- empty, and recalculates count_reference against the clipped geometry.
-- Nightly processing no longer clips — the clip lives here.
--
-- Run on production at freeze / delivery time (same DB that will feed nightly QA):
-- edit the variables in the DECLARE block, then run the whole script.
--
-- This script is step 2 of the freeze checklist. Everything that happens before
-- and after it (SQL dump export, spec, load/verify,
-- publish, Import, processing step 9) is documented once in
-- docs/Parking-Client-Freeze-QA.md — follow that.

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
  target_ref_sum bigint;
  base_ref_sum bigint;
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
        count_reference smallint,
        priority boolean
      )
    $sql$,
    target_table
  );

  -- Always ST_Intersection (34k rows, once, manual). ST_Intersection of a cell
  -- already within Berlin is a no-op on the polygon; CollectionExtract keeps it polygonal.
  EXECUTE format(
    $sql$
      INSERT INTO data.%I (id, geom, name, priority, count_reference)
      SELECT
        b.id::TEXT,
        clipped.geom,
        b.name,
        b.priority,
        LEAST(COALESCE(c.cnt, 0), 32767)::SMALLINT AS count_reference
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
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::INTEGER AS cnt
          FROM
            _qa_voronoi_baseline_points p
          WHERE
            public.ST_Contains(public.ST_Transform(clipped.geom, 5243), p.geom)
        ) c ON TRUE
      WHERE
        berlin.osm_id = 62422
        AND NOT public.ST_IsEmpty(clipped.geom)
    $sql$,
    target_table,
    base_table
  );

  EXECUTE format('SELECT count(*) FROM data.%I', base_table) INTO base_rows;
  EXECUTE format('SELECT COALESCE(SUM(count_reference), 0) FROM data.%I', base_table) INTO base_ref_sum;
  EXECUTE format('SELECT count(*) FROM data.%I', target_table) INTO target_rows;
  EXECUTE format('SELECT COALESCE(SUM(count_reference), 0) FROM data.%I', target_table) INTO target_ref_sum;

  dropped := base_rows - target_rows;
  -- Empty-after-clip cells are dropped on purpose (4 on the 2026 vintage).
  -- 50 is a sanity cap so a broken clip cannot silently wipe the table.
  IF target_rows > base_rows THEN
    RAISE EXCEPTION 'Target has more rows than base: base=% target=%', base_rows, target_rows;
  END IF;
  IF dropped > 50 THEN
    RAISE EXCEPTION 'Dropped % cells (base=% target=%); sanity cap is 50', dropped, base_rows, target_rows;
  END IF;

  RAISE NOTICE 'Created data.%: rows=%, dropped=%, sum(count_reference)=% (base data.% was sum=%)',
    target_table, target_rows, dropped, target_ref_sum, base_table, base_ref_sum;
END $$;
