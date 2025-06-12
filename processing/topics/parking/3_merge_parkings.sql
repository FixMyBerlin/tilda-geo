DO $$ BEGIN RAISE NOTICE 'START merging parkings %', clock_timestamp(); END $$;

-- Merge lines that have the same (explisitldy defined) properties.
-- ==========
--
-- REMINDER: We need to update those properies manually whenever we add relevant data
-- When we don't, we will randomly merge lines and loose data.
-- See processing/topics/parking/parkings/helper/result_tags_parkings.lua
--
--
-- 1. Create a TEMP table and  that we use for clustering
-- Properties that are in tags (jsonb) and need to be clustered should be separate columns so we can index them properly.
-- The temp table is dropped automatically once our db connection is closed.
SELECT
  p.*,
  -- REMINDER: Every value here need to be defined in multiple places
  -- 'street_name' is already a separate column
  -- 'side' is already a separate column
  tags ->> 'orientation' as orientation,
  tags ->> 'parking' as parking,
  tags ->> 'road_width' as road_width
  -- TODO LATER: restrictions
  -- tags ->> 'surface' as surface,
  -- TODO LATER: surface: Wir müssen die road surface übernehmen auf parking surface aber nur wenn parking surface nil. Und dann ist die confidence medium weil wir es übernommen haben
  --
  INTO TEMP cluster_candidates
FROM
  _parking_parkings2_cut p;

CREATE INDEX cluster_candidates_idx ON cluster_candidates USING BTREE (
  osm_id,
  -- REMINDER: Every value here need to be defined in multiple places
  street_name,
  side,
  orientation,
  parking,
  road_width
  -- /REMINDER
);

CREATE INDEX cluster_candidates_geom_idx ON cluster_candidates USING GIST (geom);

-- 2. Create the result table.
-- Create one table where connected linestrings are merged which is later used to snap to
DROP TABLE IF EXISTS _parking_parkings3_merged;

-- We merge after grouping by street name and side, so that the merged kerbs should correspond to the street kerbs
WITH
  clustered AS (
    SELECT
      osm_id,
      geom,
      -- REMINDER: Every value here need to be defined in multiple places
      street_name,
      side,
      orientation,
      parking,
      road_width,
      -- /REMINDER
      ST_ClusterDBSCAN (geom, eps := 0.005, minpoints := 1) OVER (
        PARTITION BY
          -- REMINDER: Every value here need to be defined in multiple places
          street_name,
          side,
          orientation,
          parking,
          road_width
          -- /REMINDER
      ) AS cluster_id
    FROM
      cluster_candidates
  )
SELECT
  ROW_NUMBER() OVER () AS id,
  cluster_id,
  -- REMINDER: Every value here need to be defined in multiple places
  street_name,
  side,
  orientation,
  parking,
  road_width,
  -- /REMINDER
  array_agg(osm_id) AS original_osm_ids,
  (ST_Dump (ST_LineMerge (ST_Union (geom, 0.005)))).geom AS geom
  --
  INTO _parking_parkings3_merged
FROM
  clustered
GROUP BY
  -- REMINDER: Every value here need to be defined in multiple places
  street_name,
  side,
  orientation,
  parking,
  road_width,
  -- /REMINDER
  cluster_id;
