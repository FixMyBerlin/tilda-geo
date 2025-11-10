DO $$ BEGIN RAISE NOTICE 'START merging parkings %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- 1. Create a TEMP table and  that we use for clustering
-- Properties that are in tags (jsonb) and need to be clustered should be separate columns so we can index them properly.
-- The temp table is dropped automatically once our db connection is closed.
CREATE TEMP TABLE cluster_candidates AS
SELECT
  id,
  geom,
  tag_source,
  geom_source,
  (tags ->> 'capacity')::NUMERIC AS capacity,
  (tags ->> 'area')::NUMERIC AS area,
  jsonb_build_object(
    -- CRITICAL: Keep these lists in sync:
    -- 1. `result_tags` in `processing/topics/parking/parkings/helper/result_tags_parkings.lua`
    -- 2. `result_tags` in `processing/topics/parking/separate_parkings/helper/result_tags_separate_parking.lua`
    -- 3. `jsonb_build_object` in `processing/topics/parking/4_merge_parkings.sql`
    /* sql-formatter-disable */
    'side', side,
    'source', tags->>'source',
    --
    -- Road properties
    'road', tags ->> 'road',
    'road_name', COALESCE(tags ->> 'road_name', street_name), -- this fallback should probably be implemented earlier
    'road_width', tags ->> 'road_width',
    'road_width_confidence', tags ->> 'road_width_confidence',
    'road_width_source', tags ->> 'road_width_source',
    'road_oneway', tags ->> 'road_oneway',
    'operator_type', tags ->> 'operator_type',
    'mapillary', tags ->> 'mapillary',
    --
    -- Capacity & Area
    -- capacity - separate column
    'capacity_source', tags ->> 'capacity_source',
    'capacity_confidence', tags ->> 'capacity_confidence',
    -- 'area', tags ->> 'area',
    'area_confidence', tags ->> 'area_confidence',
    'area_source', tags ->> 'area_source',
    --
    -- Parking properties
    'condition_category', tags ->> 'condition_category',
    'condition_vehicles', tags ->> 'condition_vehicles',
    'covered', tags ->> 'covered',
    'direction', tags ->> 'direction',
    'fee', tags ->> 'fee',
    'informal', tags ->> 'informal',
    'location', tags ->> 'location',
    'markings', tags ->> 'markings',
    'orientation', tags ->> 'orientation',
    'parking', tags ->> 'parking',
    'reason', tags ->> 'reason',
    'staggered', tags ->> 'staggered',
    'traffic_sign', tags ->> 'traffic_sign',
    'zone', tags ->> 'zone',
    --
    -- Surface
    'surface', tags ->> 'surface',
    'surface_confidence', tags ->> 'surface_confidence',
    'surface_source', tags ->> 'surface_source'
    /* sql-formatter-enable*/
  ) as tags,
  0 as cluster_id
FROM
  _parking_parkings_cutted p;

CREATE INDEX cluster_candidates_idx ON cluster_candidates USING BTREE (tags);

CREATE INDEX cluster_candidates_geom_idx ON cluster_candidates USING GIST (geom);

-- We assign a cluster_id to each spatially connected group of parkings that share the same tags
WITH
  clustered AS (
    SELECT
      id,
      ST_ClusterDBSCAN (geom, eps := 0.0, minpoints := 1) OVER (
        PARTITION BY
          tags
        ORDER BY
          id
      ) AS cluster_id
    FROM
      cluster_candidates
  )
UPDATE cluster_candidates cc
SET
  cluster_id = clustered.cluster_id
FROM
  clustered
WHERE
  cc.id = clustered.id;

CREATE INDEX cluster_candidates_full_idx ON cluster_candidates USING BTREE (cluster_id, tags);

-- 2. Create the result table.
-- aggreagate the groups by merging each cluster
DROP TABLE IF EXISTS _parking_parkings_merged;

CREATE TABLE _parking_parkings_merged AS
WITH
  merged AS (
    SELECT
      cluster_id,
      tags || jsonb_build_object(
        /* sql-formatter-disable */
        'capacity', SUM(capacity),
        'area', SUM(area),
        'tag_sources', string_agg(tag_source, ';' ORDER BY tag_source),
        'geom_sources', string_agg(geom_source, ';' ORDER BY geom_source)
        /* sql-formatter-enable */
      ) AS tags,
      /* sql-formatter-disable */
      string_agg(id::TEXT, '-' ORDER BY id) AS original_ids,
      /* sql-formatter-enable */
      (
        ST_Dump (ST_LineMerge (ST_Node (ST_Collect (geom))))
      ).*
    FROM
      cluster_candidates
    GROUP BY
      tags,
      cluster_id
  )
SELECT
  md5(original_ids) AS id,
  merged.*
FROM
  merged;

-- Sometimes ST_LineMerge fails because the geomtries are not perfectly connected in those cases we use the following more aggresive way to merge the geometries
CREATE INDEX _parking_parkings_merged_id_idx ON _parking_parkings_merged USING BTREE (id);

WITH
  cutted_geoms AS (
    SELECT
      id,
      (ST_Dump (ST_Node (ST_Union (geom)))).geom AS geom
    FROM
      _parking_parkings_merged
    GROUP BY
      id
    HAVING
      count(*) > 1
  ),
  filtered_geoms AS (
    SELECT
      id,
      (ST_Dump (ST_LineMerge (ST_Collect (geom)))).geom AS geom
    FROM
      cutted_geoms
    WHERE
      ST_Length (geom) > 0.5
    GROUP BY
      id
  )
UPDATE _parking_parkings_merged pm
SET
  geom = fg.geom
FROM
  filtered_geoms fg
WHERE
  pm.id = fg.id;

-- now we have the same entry multiple times so we remove duplicates
DELETE FROM _parking_parkings_merged
WHERE
  ctid NOT IN (
    SELECT
      min(ctid)
    FROM
      _parking_parkings_merged
    GROUP BY
      id
  );

CREATE TEMP TABLE failed_merges AS
SELECT
  id
FROM
  _parking_parkings_merged
GROUP BY
  id
HAVING
  count(*) > 1;

-- if we still have clusters that failed to merge we save them in a separate table and remove their capacity so it will get estimated later on
DROP TABLE IF EXISTS _parking_failed_merges;

CREATE TABLE _parking_failed_merges AS
SELECT
  *
FROM
  _parking_parkings_merged
WHERE
  id IN (
    SELECT
      id
    FROM
      failed_merges
  );

UPDATE _parking_parkings_merged
SET
  tags = tags - 'capacity',
  id = _parking_parkings_merged.id || (_parking_parkings_merged.path[1])::TEXT
FROM
  failed_merges
WHERE
  _parking_parkings_merged.id = failed_merges.id;

DO $$
  DECLARE
    failed_clusters_count INTEGER;
    failed_rows_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO failed_clusters_count FROM failed_merges;
    SELECT COUNT(*) INTO failed_rows_count FROM _parking_failed_merges;
    IF failed_clusters_count > 0 THEN
      RAISE WARNING '[WARNING] Failed to merge % cluster(s) (% rows total). After initial `ST_LineMerge` and fallback attempts, these parkings still have disconnected linestring geometries (gaps between segments or non-touching endpoints) that cannot be merged. Action taken: saved to `_parking_failed_merges`, removed capacity tag (will be estimated in `5_estimate_parking_capacities.sql`), and modified IDs to make them unique.', failed_clusters_count, failed_rows_count;
    END IF;
  END $$;

-- MISC
CREATE INDEX parking_parkings_merged_geom_idx ON _parking_parkings_merged USING GIST (geom);

ALTER TABLE _parking_parkings_merged
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_Transform (geom, 5243);

CREATE INDEX parking_parkings_failed_merges_idx ON _parking_failed_merges USING GIST (geom);

ALTER TABLE _parking_failed_merges
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_Transform (geom, 5243);
