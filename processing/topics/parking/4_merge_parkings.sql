-- WHAT IT DOES:
-- Merge spatially connected parkings with same tags into single parkings.
-- * Cluster parkings by tags using ST_ClusterDBSCAN
-- * Merge clustered parkings: sum capacity/area, merge geometries (ST_LineMerge)
--   (Two merging strategies are used.)
-- * Handle failed merges: remove capacity tags (will be estimated in `5_estimate_parking_capacities.sql`)
--   (…and Log warnings if needed.)
-- INPUT: `_parking_parkings_cutted` (linestring) - parkings after cutouts
-- OUTPUT: `_parking_parkings_merged` (linestring, 5243), `_parking_parkings_failed_merges` (failed cases)
--
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
-- ST_ClusterDBSCAN parameters:
--   geom: geometry column to cluster
--   eps := 0.0: distance threshold (0.0 means only touching/intersecting geometries are clustered together)
--   minpoints := 1: minimum number of geometries to form a cluster (1 means any single geometry can be its own cluster)
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
      -- Merge geometries chain:
      -- 1. ST_Collect(geom): Groups all linestring geometries in the cluster into a MultiLineString
      -- 2. ST_Node(...): Adds nodes at all intersection points between linestrings. This ensures that linestrings that touch or cross each other share common nodes, which is required for ST_LineMerge to work correctly.
      -- 3. ST_LineMerge(...): Merges connected linestrings (those that share endpoints) into single continuous linestrings. If some segments are disconnected, the result remains a MultiLineString.
      -- 4. ST_Dump(...): If the result is a MultiLineString with disconnected parts, ST_Dump returns a set of (path, geom) tuples - one row per disconnected linestring segment. If it's a single LineString, it returns one row.
      -- 5. .*: Expands the (path, geom) tuple into separate path and geom columns. The path column indicates which part of the MultiLineString this row represents (e.g., {1} for first part, {2} for second part).
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

ALTER TABLE _parking_parkings_merged
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_Transform (geom, 5243);

CREATE INDEX _parking_parkings_merged_id_idx ON _parking_parkings_merged USING BTREE (id);

CREATE INDEX parking_parkings_merged_geom_idx ON _parking_parkings_merged USING GIST (geom);

-- Sometimes ST_LineMerge fails because the geomtries are not perfectly connected in those cases we use the following more aggresive way to merge the geometries
WITH
  -- Fallback merge step 1: More aggressive geometry union and node creation
  -- This handles cases where the initial merge (`ST_Collect` + `ST_LineMerge`) failed because geometries weren't perfectly connected.
  -- `ST_Union(geom)` unions all geometries for the same `id` (see `GROUP BY`). Key difference: `ST_Union` merges (dissolves) geometries that touch or overlap, whereas `ST_LineMerge` requires exact endpoint connections. This allows merging geometries with small gaps or overlaps that the initial method could not merge.
  -- HAVING count(*) > 1: Only process IDs that have multiple rows (failed merges from the initial attempt above (`ST_Collect` + `ST_LineMerge`))
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
  -- Fallback merge step 2: Attempt to merge the processed geometries using `ST_Collect` + `ST_LineMerge` again
  -- But this time on the geometries that failed to merge in the initial attempt above and were then merged more aggressively with `ST_Union`.
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

-- If we still have clusters that failed to merge we save them in a separate table and remove their capacity so it will get estimated in `5_estimate_parking_capacities.sql`
DROP TABLE IF EXISTS _parking_parkings_failed_merges;

CREATE TABLE _parking_parkings_failed_merges AS
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

-- WARNING: Check failed merges table
DO $$
  DECLARE
    failed_clusters_count INTEGER;
    failed_rows_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO failed_clusters_count FROM failed_merges;
    SELECT COUNT(*) INTO failed_rows_count FROM _parking_parkings_failed_merges;
    IF failed_clusters_count > 0 THEN
      RAISE WARNING '[WARNING] Failed to merge % cluster(s) (% rows total). After initial `ST_LineMerge` and fallback attempts, these parkings still have disconnected linestring geometries (gaps between segments or non-touching endpoints) that cannot be merged. Action taken: saved to `_parking_parkings_failed_merges`, removed capacity tag (will be estimated in `5_estimate_parking_capacities.sql`), and modified IDs to make them unique.', failed_clusters_count, failed_rows_count;
    END IF;
  END $$;

ALTER TABLE _parking_parkings_failed_merges
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_Transform (geom, 5243);

DROP INDEX IF EXISTS parking_parkings_failed_merges_idx;

CREATE INDEX parking_parkings_failed_merges_idx ON _parking_parkings_failed_merges USING GIST (geom);
