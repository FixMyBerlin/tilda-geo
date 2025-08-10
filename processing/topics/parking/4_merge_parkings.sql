DO $$ BEGIN RAISE NOTICE 'START merging parkings %', clock_timestamp(); END $$;

-- Merge lines that have the same (explisitldy defined) properties.
-- ==========
--
-- CRITICAL: This SQL file must be kept in sync with processing/topics/parking/parkings/helper/result_tags_parkings.lua (all tags in explicit list)
--
-- When adding new tags in lua, make sure to also add them in the query below to `jsonb_build_object()`
--
-- 1. Create a TEMP table and  that we use for clustering
-- Properties that are in tags (jsonb) and need to be clustered should be separate columns so we can index them properly.
-- The temp table is dropped automatically once our db connection is closed.
SELECT
  id,
  osm_id,
  geom,
  (tags ->> 'capacity')::NUMERIC AS capacity,
  jsonb_build_object(
    'street_name',
    street_name,
    'side',
    side,
    'source',
    source,
    'road_name',
    tags ->> 'road_name',
    'road_width',
    tags ->> 'road_width',
    'road_width_confidence',
    tags ->> 'road_width_confidence',
    'road_width_source',
    tags ->> 'road_width_source',
    'road',
    tags ->> 'road',
    'operator_type',
    tags ->> 'operator_type',
    'parking',
    tags ->> 'parking',
    'orientation',
    tags ->> 'orientation',
    'capacity_source',
    tags ->> 'capacity_source',
    'capacity_confidence',
    tags ->> 'capacity_confidence',
    'markings',
    tags ->> 'markings',
    'direction',
    tags ->> 'direction',
    'reason',
    tags ->> 'reason',
    'staggered',
    tags ->> 'staggered',
    'restriction',
    tags ->> 'restriction',
    -- tags ->> 'restriction_bus' , restriction_bus,
    -- tags ->> 'restriction_hgv' , restriction_hgv,
    -- tags ->> 'restriction_reason' , restriction_reason,
    'zone',
    tags ->> 'zone',
    'authentication_disc',
    tags ->> 'authentication_disc',
    'fee',
    tags ->> 'fee',
    'maxstay',
    tags ->> 'maxstay',
    -- tags ->> 'maxstay_motorhome' , maxstay_motorhome,
    -- tags ->> 'access' , access,
    -- tags ->> 'private' , private,
    -- tags ->> 'disabled' , disabled,
    -- tags ->> 'taxi' , taxi,
    -- tags ->> 'motorcar' , motorcar,
    -- tags ->> 'hgv' , hgv,
    'surface',
    tags ->> 'surface',
    'surface_confidence',
    tags ->> 'surface_confidence',
    'surface_source',
    tags ->> 'surface_source',
    'condition_category',
    tags ->> 'condition_category',
    'condition_vehicles',
    tags ->> 'condition_vehicles',
    'mapillary',
    tags ->> 'mapillary'
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
      ST_ClusterDBSCAN (geom, eps := 0.1, minpoints := 1) OVER (
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
      array_agg(osm_id) AS original_osm_ids,
      (ST_Dump (ST_LineMerge (ST_Union (geom)))).geom::geometry (LINESTRING) AS geom
    FROM
      cluster_candidates
    GROUP BY
      tags,
      cluster_id
  )
SELECT
  ROW_NUMBER() OVER () AS id,
  merged.* INTO _parking_parkings_merged
FROM
  merged;
