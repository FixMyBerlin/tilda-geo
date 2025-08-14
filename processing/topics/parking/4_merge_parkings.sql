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
    /* sql-formatter-disable */
    'side', side,
    'source', source,
    'parking_source', source,
    'road', tags ->> 'road',
    'road_name', COALESCE(tags ->> 'road_name', street_name),
    'road_width', tags ->> 'road_width',
    'road_width_confidence', tags ->> 'road_width_confidence',
    'road_width_source', tags ->> 'road_width_source',
    'road_oneway', tags ->> 'road_oneway',
    'operator_type', tags ->> 'operator_type',
    'parking', tags ->> 'parking',
    'orientation', tags ->> 'orientation',
    'capacity_source', tags ->> 'capacity_source',
    'capacity_confidence', tags ->> 'capacity_confidence',
    'markings', tags ->> 'markings',
    'direction', tags ->> 'direction',
    'staggered', tags ->> 'staggered',
    'zone', tags ->> 'zone',
    'fee', tags ->> 'fee',
    -- 'maxstay', tags ->> 'maxstay',
    'informal', tags ->> 'informal',
    'location', tags ->> 'location',
    'surface', tags ->> 'surface',
    'surface_confidence', tags ->> 'surface_confidence',
    'surface_source', tags ->> 'surface_source',
    'condition_category', tags ->> 'condition_category',
    'condition_vehicles', tags ->> 'condition_vehicles',
    'mapillary', tags ->> 'mapillary'
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
      ST_ClusterDBSCAN (geom, eps := 0.1, minpoints := 1) OVER (
        PARTITION BY
          tags
        ORDER BY
          ST_Y (ST_StartPoint (geom)),
          ST_X (ST_StartPoint (geom)),
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
      tags || jsonb_build_object('capacity', s.capacity) AS tags,
      s.original_osm_ids,
      (
        ST_Dump (
          CASE
            WHEN ST_Y (ST_StartPoint (lm)) > ST_Y (ST_EndPoint (lm))
            OR (
              ST_Y (ST_StartPoint (lm)) = ST_Y (ST_EndPoint (lm))
              AND ST_X (ST_StartPoint (lm)) > ST_X (ST_EndPoint (lm))
            ) THEN ST_Reverse (lm)
            ELSE lm
          END
        )
      ).geom::geometry (LINESTRING) AS geom
    FROM
      (
        SELECT
          tags,
          cluster_id,
          array_agg(
            osm_id
            ORDER BY
              osm_id
          ) AS original_osm_ids,
          SUM(capacity) AS capacity,
          ST_LineMerge (
            ST_UnaryUnion (ST_Union (ST_SnapToGrid (geom, 0.01)))
          ) AS lm
        FROM
          cluster_candidates
        GROUP BY
          tags,
          cluster_id
      ) s
  )
SELECT
  ROW_NUMBER() OVER (
    ORDER BY
      tags::text,
      -- cluster_id is not carried out of CTE; recompute a stable geometry-based sort for determinism
      ST_Y (ST_StartPoint (geom)),
      ST_X (ST_StartPoint (geom))
  ) AS id,
  merged.* INTO _parking_parkings_merged
FROM
  merged
ORDER BY
  tags::text,
  ST_Y (ST_StartPoint (geom)),
  ST_X (ST_StartPoint (geom));
