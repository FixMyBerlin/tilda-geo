DO $$ BEGIN RAISE NOTICE 'START merging parkings %', clock_timestamp(); END $$;

-- Merge lines that have the same (explisitldy defined) properties.
-- ==========
--
-- CRITICAL: This SQL file must be kept in sync with processing/topics/parking/parkings/helper/result_tags_parkings.lua (all tags in explicit list)
--
-- When adding new tags:
-- 1. Add to the Lua file's explicit tags list
-- 2. Add to this SQL clustering columns and jsonb_build_object
--
-- 1. Create a TEMP table and  that we use for clustering
-- Properties that are in tags (jsonb) and need to be clustered should be separate columns so we can index them properly.
-- The temp table is dropped automatically once our db connection is closed.
SELECT
  p.*,
  -- EXPLICIT TAGS LIST - ALL TAGS MUST BE LISTED HERE
  -- This list must be kept in sync with result_tags_parkings.lua
  -- Road properties
  tags ->> 'road_name' as road_name,
  tags ->> 'road_width' as road_width,
  tags ->> 'road_width_confidence' as road_width_confidence,
  tags ->> 'road_width_source' as road_width_source,
  tags ->> 'road' as road,
  tags ->> 'operator_type' as operator_type,
  tags ->> 'parking' as parking,
  tags ->> 'orientation' as orientation,
  tags ->> 'capacity' as capacity,
  tags ->> 'capacity_source' as capacity_source,
  tags ->> 'capacity_confidence' as capacity_confidence,
  tags ->> 'markings' as markings,
  tags ->> 'direction' as direction,
  tags ->> 'reason' as reason,
  tags ->> 'staggered' as staggered,
  tags ->> 'restriction' as restriction,
  -- tags ->> 'restriction_bus' as restriction_bus,
  -- tags ->> 'restriction_hgv' as restriction_hgv,
  -- tags ->> 'restriction_reason' as restriction_reason,
  tags ->> 'zone' as zone,
  tags ->> 'authentication_disc' as authentication_disc,
  tags ->> 'fee' as fee,
  tags ->> 'maxstay' as maxstay,
  -- tags ->> 'maxstay_motorhome' as maxstay_motorhome,
  -- tags ->> 'access' as access,
  -- tags ->> 'private' as private,
  -- tags ->> 'disabled' as disabled,
  -- tags ->> 'taxi' as taxi,
  -- tags ->> 'motorcar' as motorcar,
  -- tags ->> 'hgv' as hgv,
  tags ->> 'surface' as surface,
  tags ->> 'surface_confidence' as surface_confidence,
  tags ->> 'surface_source' as surface_source,
  tags ->> 'condition_category' as condition_category,
  tags ->> 'condition_vehicles' as condition_vehicles,
  tags ->> 'mapillary' as mapillary
  --
  INTO TEMP cluster_candidates
FROM
  _parking_parkings_cutted p;

CREATE INDEX cluster_candidates_idx ON cluster_candidates USING BTREE (
  -- EXPLICIT TAGS LIST - ALL TAGS MUST BE LISTED HERE
  -- This list must be kept in sync with result_tags_parkings.lua
  street_name,
  side,
  road_name,
  road_width,
  road_width_confidence,
  road_width_source,
  road,
  operator_type,
  parking,
  orientation,
  capacity,
  capacity_source,
  capacity_confidence,
  markings,
  direction,
  reason,
  staggered,
  restriction,
  -- restriction_bus,
  -- restriction_hgv,
  -- restriction_reason,
  zone,
  authentication_disc,
  fee,
  maxstay,
  -- maxstay_motorhome,
  -- access,
  -- private,
  -- disabled,
  -- taxi,
  -- motorcar,
  -- hgv,
  surface,
  surface_confidence,
  surface_source,
  condition_category,
  condition_vehicles,
  mapillary,
  source
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
      -- EXPLICIT TAGS LIST - ALL TAGS MUST BE LISTED HERE
      -- This list must be kept in sync with result_tags_parkings.lua
      street_name,
      side,
      road_name,
      road_width,
      road_width_confidence,
      road_width_source,
      road,
      operator_type,
      parking,
      orientation,
      capacity,
      capacity_source,
      capacity_confidence,
      markings,
      direction,
      reason,
      staggered,
      restriction,
      -- restriction_bus,
      -- restriction_hgv,
      -- restriction_reason,
      zone,
      authentication_disc,
      fee,
      maxstay,
      -- maxstay_motorhome,
      -- access,
      -- private,
      -- disabled,
      -- taxi,
      -- motorcar,
      -- hgv,
      surface,
      surface_confidence,
      surface_source,
      condition_category,
      condition_vehicles,
      source,
      mapillary,
      ST_ClusterDBSCAN (geom, eps := 0.01, minpoints := 1) OVER (
        PARTITION BY
          -- EXPLICIT TAGS LIST - ALL TAGS MUST BE LISTED HERE
          -- This list must be kept in sync with result_tags_parkings.lua
          street_name,
          side,
          road_name,
          road_width,
          road_width_confidence,
          road_width_source,
          road,
          operator_type,
          parking,
          orientation,
          capacity,
          capacity_source,
          capacity_confidence,
          markings,
          direction,
          reason,
          staggered,
          restriction,
          -- restriction_bus,
          -- restriction_hgv,
          -- restriction_reason,
          zone,
          authentication_disc,
          fee,
          maxstay,
          -- maxstay_motorhome,
          -- access,
          -- private,
          -- disabled,
          -- taxi,
          -- motorcar,
          -- hgv,
          surface,
          surface_confidence,
          surface_source,
          condition_category,
          condition_vehicles,
          source,
          mapillary
        ORDER BY
          id
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
  -- EXPLICIT TAGS LIST - ALL TAGS MUST BE LISTED HERE
  -- This list must be kept in sync with result_tags_parkings.lua
  jsonb_build_object(
    /* sql-formatter-disable */
    'side', side,
    'road_name', COALESCE(street_name, road_name),
    'road_width', road_width,
    'road_width_confidence', road_width_confidence,
    'road_width_source', road_width_source,
    'road', road,
    'operator_type', operator_type,
    'parking', parking,
    'orientation', orientation,
    'capacity', SUM(capacity::NUMERIC),
    'capacity_source', capacity_source,
    'capacity_confidence', capacity_confidence,
    'markings', markings,
    'direction', direction,
    'reason', reason,
    'staggered', staggered,
    'restriction', restriction,
    -- 'restriction_bus', restriction_bus,
    -- 'restriction_hgv', restriction_hgv,
    -- 'restriction_reason', restriction_reason,
    'zone', zone,
    'authentication_disc', authentication_disc,
    'fee', fee,
    'maxstay', maxstay,
    -- 'maxstay_motorhome', maxstay_motorhome,
    -- 'access', access,
    -- 'private', private,
    -- 'disabled', disabled,
    -- 'taxi', taxi,
    -- 'motorcar', motorcar,
    -- 'hgv', hgv,
    'surface', surface,
    'surface_confidence', surface_confidence,
    'surface_source', surface_source,
    'condition_category', condition_category,
    'condition_vehicles', condition_vehicles,
    'source', source,
    'mapillary', mapillary
    /* sql-formatter-enable */
  ) as tags,
  array_agg(osm_id) AS original_osm_ids,
  (ST_Dump (ST_LineMerge (ST_Union (geom, 0.005)))).geom::geometry (LINESTRING) AS geom
  --
  INTO _parking_parkings_merged
FROM
  clustered
GROUP BY
  -- EXPLICIT TAGS LIST - ALL TAGS MUST BE LISTED HERE
  -- This list must be kept in sync with result_tags_parkings.lua
  street_name,
  side,
  road_name,
  road_width,
  road_width_confidence,
  road_width_source,
  road,
  operator_type,
  parking,
  orientation,
  capacity_source,
  capacity_confidence,
  markings,
  direction,
  reason,
  staggered,
  restriction,
  -- restriction_bus,
  -- restriction_hgv,
  -- restriction_reason,
  zone,
  authentication_disc,
  fee,
  maxstay,
  -- maxstay_motorhome,
  -- access,
  -- private,
  -- disabled,
  -- taxi,
  -- motorcar,
  -- hgv,
  surface,
  surface_confidence,
  surface_source,
  condition_category,
  condition_vehicles,
  source,
  mapillary,
  cluster_id;
