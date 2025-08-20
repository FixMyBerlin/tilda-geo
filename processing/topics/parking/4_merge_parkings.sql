DO $$ BEGIN RAISE NOTICE 'START merging parkings %', clock_timestamp(); END $$;

-- 1. Create a TEMP table and  that we use for clustering
-- Properties that are in tags (jsonb) and need to be clustered should be separate columns so we can index them properly.
-- The temp table is dropped automatically once our db connection is closed.
SELECT
  id,
  osm_id,
  geom,
  (tags ->> 'capacity')::NUMERIC AS capacity,
  jsonb_build_object(
    -- CRITICAL: Keep these lists in sync:
    -- 1. `result_tags` in `processing/topics/parking/parkings/helper/result_tags_parkings.lua`
    -- 2. `merge_tags` in `processing/topics/parking/separate_parkings/helper/result_tags_separate_parking.lua`
    -- 3. `jsonb_build_object` in `processing/topics/parking/4_merge_parkings.sql`
    /* sql-formatter-disable */
    'side', side,
    'source', source,
    --
    -- Road properties
    'road', tags ->> 'road',
    'road_name', COALESCE(tags ->> 'road_name', street_name),
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
    -- 'area_confidence', tags ->> 'area_confidence',
    -- 'area_source', tags ->> 'area_source',
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
  0 as cluster_id INTO TEMP cluster_candidates
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

WITH
  merged AS (
    SELECT
      tags || jsonb_build_object('capacity', SUM(capacity)) AS tags,
      string_agg(
        'way/' || id::TEXT,
        '-'
        ORDER BY
          id
      ) AS original_ids,
      string_agg(
        osm_id::TEXT,
        '-'
        ORDER BY
          osm_id
      ) AS original_osm_ids,
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
  md5(ST_AsEWKB (geom)::text) AS id,
  merged.* INTO _parking_parkings_merged
FROM
  merged;

-- Sometimes ST_LineMerge fails because the geomtries are not perfectly connected in those cases we use the following more aggresive way to merge the geometries
CREATE INDEX _parking_parkings_merged_id_idx ON _parking_parkings_merged USING BTREE (original_ids);

WITH
  cutted_geoms AS (
    SELECT
      original_ids,
      (ST_Dump (ST_Node (ST_Union (geom)))).geom AS geom
    FROM
      _parking_parkings_merged
    GROUP BY
      original_ids
    HAVING
      count(*) > 1
  ),
  filtered_geoms AS (
    SELECT
      original_ids,
      (ST_Dump (ST_LineMerge (ST_Collect (geom)))).geom AS geom
    FROM
      cutted_geoms
    WHERE
      ST_Length (geom) > 0.5
    GROUP BY
      original_ids
  )
UPDATE _parking_parkings_merged pm
SET
  geom = fg.geom,
  id = md5(ST_AsEWKB (fg.geom)::text)
FROM
  filtered_geoms fg
WHERE
  pm.original_ids = fg.original_ids;

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

SELECT
  original_ids INTO TEMP failed_merges
FROM
  _parking_parkings_merged
GROUP BY
  original_ids
HAVING
  count(*) > 1;

-- if we still have clusters that failed to merge we remove the capcaity so it will get estimated later on
UPDATE _parking_parkings_merged
SET
  tags = tags - 'capacity'
WHERE
  original_ids IN (
    SELECT
      original_ids
    FROM
      failed_merges
  );

DO $$
  DECLARE
    failed_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO failed_count
    FROM failed_merges;
    RAISE NOTICE 'Failed to merge % clusters. Their capacity will be estimated.', failed_count;
  END $$;
