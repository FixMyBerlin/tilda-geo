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
  tags ->> 'road_width' as road_width,
  tags ->> 'capacity' as capacity,
  tags ->> 'capacity_source' as capacity_source,
  tags ->> 'capacity_confidence' as capacity_confidence
  -- TODO LATER: restrictions
  -- tags ->> 'surface' as surface,
  -- TODO LATER: surface: Wir müssen die road surface übernehmen auf parking surface aber nur wenn parking surface nil. Und dann ist die confidence medium weil wir es übernommen haben
  --
  INTO TEMP cluster_candidates
FROM
  _parking_parkings_cutted p;

CREATE INDEX cluster_candidates_idx ON cluster_candidates USING BTREE (
  -- REMINDER: Every value here need to be defined in multiple places
  street_name,
  side,
  orientation,
  parking,
  road_width,
  capacity_source,
  capacity_confidence,
  source
  -- /REMINDER
);

CREATE INDEX cluster_candidates_geom_idx ON cluster_candidates USING GIST (geom);

-- 2. Create the result table.
-- Create one table where connected linestrings are merged which is later used to snap to
DROP TABLE IF EXISTS _parking_parkings_merged;

-- We merge after grouping by street name and side, so that the merged kerbs should correspond to the street kerbs
WITH
  clustered AS (
    SELECT
      id,
      osm_id,
      geom,
      -- REMINDER: Every value here need to be defined in multiple places
      street_name,
      side,
      orientation,
      parking,
      road_width,
      capacity,
      capacity_source,
      capacity_confidence,
      source,
      -- /REMINDER
      ST_ClusterDBSCAN (geom, eps := 0.01, minpoints := 1) OVER (
        PARTITION BY
          -- REMINDER: Every value here need to be defined in multiple places
          street_name,
          side,
          orientation,
          parking,
          road_width,
          capacity_source,
          capacity_confidence,
          source
          -- /REMINDER
      ) AS cluster_id
    FROM
      cluster_candidates
  )
SELECT
  string_agg(
    id,
    '-'
    ORDER BY
      id
  ) AS id,
  cluster_id,
  -- REMINDER: Every value here need to be defined in multiple places
  jsonb_build_object(
    'street:name',
    street_name,
    'side',
    side,
    'orientation',
    orientation,
    'parking',
    parking,
    'road_width',
    road_width,
    'source',
    source,
    'capacity',
    SUM(capacity::NUMERIC),
    'capacity_source',
    capacity_source,
    'capacity_confidence',
    capacity_confidence
  ) as tags,
  -- /REMINDER
  array_agg(osm_id) AS original_osm_ids,
  (ST_Dump (ST_LineMerge (ST_Union (geom, 0.005)))).geom::geometry (LINESTRING) AS geom
  --
  INTO _parking_parkings_merged
FROM
  clustered
GROUP BY
  -- REMINDER: Every value here need to be defined in multiple places
  street_name,
  side,
  orientation,
  parking,
  road_width,
  capacity_source,
  capacity_confidence,
  source,
  -- /REMINDER
  cluster_id;
