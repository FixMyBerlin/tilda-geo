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
  tags ->> 'capacity' as capacity,
  tags ->> 'capacity_source' as capacity_source,
  -- tags ->> 'capacity_confidence' as capacity_confidence,
  -- Road and parking specific tags
  tags ->> 'name' as name,
  tags ->> 'road_width' as road_width,
  -- tags ->> 'road_width_confidence' as road_width_confidence,
  tags ->> 'road_width_source' as road_width_source,
  tags ->> 'road' as road,
  tags ->> 'operator_type' as operator_type,
  tags ->> 'parking' as parking,
  tags ->> 'orientation' as orientation,
  tags ->> 'markings' as markings,
  tags ->> 'direction' as direction,
  tags ->> 'reason' as reason,
  tags ->> 'staggered' as staggered,
  tags ->> 'surface' as surface,
  -- tags ->> 'surface_confidence' as surface_confidence,
  tags ->> 'surface_source' as surface_source,
  -- Merged conditional parking categories
  tags ->> 'condition_category' as condition_category,
  tags ->> 'condition_vehicles' as condition_vehicles,
  -- Base parking tags
  tags ->> 'restriction' as restriction,
  tags ->> 'restriction_bus' as restriction_bus,
  tags ->> 'restriction_hgv' as restriction_hgv,
  tags ->> 'restriction_reason' as restriction_reason,
  tags ->> 'fee' as fee,
  tags ->> 'maxstay' as maxstay,
  -- tags ->> 'maxstay:motorhome' as maxstay_motorhome,
  tags ->> 'access' as access,
  tags ->> 'private' as private,
  tags ->> 'disabled' as disabled,
  tags ->> 'charge' as charge,
  tags ->> 'taxi' as taxi,
  tags ->> 'motorcar' as motorcar,
  tags ->> 'hgv' as hgv,
  -- tags ->> 'authentication:disc' as authentication_disc,
  -- OSM tags (preserved with osm_ prefix)
  tags ->> 'osm_mapillary' as osm_mapillary
  -- tags ->> 'osm_panoramax' as osm_panoramax,
  -- tags ->> 'osm_panoramax:0' as osm_panoramax_0,
  -- tags ->> 'osm_panoramax:1' as osm_panoramax_1,
  -- tags ->> 'osm_panoramax:2' as osm_panoramax_2,
  -- tags ->> 'osm_panoramax:3' as osm_panoramax_3
  -- TODO LATER: restrictions
  -- tags ->> 'surface' as surface,
  -- TODO LATER: surface: Wir müssen die road surface übernehmen auf parking surface aber nur wenn parking surface nil. Und dann ist die confidence medium weil wir es übernommen haben
  INTO TEMP cluster_candidates
FROM
  _parking_parkings_cutted p;

CREATE INDEX cluster_candidates_idx ON cluster_candidates USING BTREE (
  -- REMINDER: Every value here need to be defined in multiple places
  street_name,
  side,
  capacity_source,
  -- capacity_confidence,
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
      capacity,
      capacity_source,
      -- capacity_confidence,
      source,
      -- Road and parking specific tags
      name,
      road_width,
      -- road_width_confidence,
      road_width_source,
      road,
      operator_type,
      parking,
      orientation,
      markings,
      direction,
      reason,
      staggered,
      surface,
      -- surface_confidence,
      surface_source,
      -- Merged conditional parking categories
      condition_category,
      condition_vehicles,
      -- Base parking tags
      restriction,
      restriction_bus,
      restriction_hgv,
      restriction_reason,
      fee,
      maxstay,
      -- maxstay_motorhome,
      access,
      private,
      disabled,
      charge,
      taxi,
      motorcar,
      hgv,
      -- authentication_disc,
      -- OSM tags (preserved with osm_ prefix)
      osm_mapillary,
      -- osm_panoramax,
      -- osm_panoramax_0,
      -- osm_panoramax_1,
      -- osm_panoramax_2,
      -- osm_panoramax_3,
      -- /REMINDER
      ST_ClusterDBSCAN (geom, eps := 0.01, minpoints := 1) OVER (
        PARTITION BY
          -- REMINDER: Every value here need to be defined in multiple places
          street_name,
          side,
          capacity_source,
          -- capacity_confidence,
          source,
          -- Road and parking specific tags
          name,
          road_width,
          -- road_width_confidence,
          road_width_source,
          road,
          operator_type,
          parking,
          orientation,
          markings,
          direction,
          reason,
          staggered,
          surface,
          -- surface_confidence,
          surface_source,
          -- Merged conditional parking categories
          condition_category,
          condition_vehicles,
          -- Base parking tags
          restriction,
          restriction_bus,
          restriction_hgv,
          restriction_reason,
          fee,
          maxstay,
          -- maxstay_motorhome,
          access,
          private,
          disabled,
          charge,
          taxi,
          motorcar,
          hgv,
          -- authentication_disc,
          -- OSM tags (preserved with osm_ prefix)
          osm_mapillary
          -- osm_panoramax,
          -- osm_panoramax_0,
          -- osm_panoramax_1,
          -- osm_panoramax_2,
          -- osm_panoramax_3
          -- /REMINDER
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
  -- REMINDER: Every value here need to be defined in multiple places
  jsonb_build_object(
    /* sql-formatter-disable */
    'street:name', street_name,
    'side', side,
    'orientation', orientation,
    'parking', parking,
    'road_width', road_width,
    'source', source,
    'capacity', SUM(capacity::NUMERIC),
    'capacity_source', capacity_source,
    -- 'capacity_confidence', capacity_confidence,
    -- Road and parking specific tags
    'name', name,
    'road_width', road_width,
    -- 'road_width_confidence', road_width_confidence,
    'road_width_source', road_width_source,
    'road', road,
    'operator_type', operator_type,
    'parking', parking,
    'orientation', orientation,
    'markings', markings,
    'direction', direction,
    'reason', reason,
    'staggered', staggered,
    'surface', surface,
    -- 'surface_confidence', surface_confidence,
    'surface_source', surface_source,
    -- Merged conditional parking categories
    'condition_category', condition_category,
    'condition_vehicles', condition_vehicles,
    -- Base parking tags
    'restriction', restriction,
    'restriction_bus', restriction_bus,
    'restriction_hgv', restriction_hgv,
    'restriction_reason', restriction_reason,
    'fee', fee,
    'maxstay', maxstay,
    -- 'maxstay:motorhome', maxstay_motorhome,
    'access', access,
    'private', private,
    'disabled', disabled,
    'charge', charge,
    'taxi', taxi,
    'motorcar', motorcar,
    'hgv', hgv,
    -- 'authentication:disc', authentication_disc,
    -- OSM tags (preserved with osm_ prefix)
    'osm_mapillary', osm_mapillary
    -- 'osm_panoramax', osm_panoramax,
    -- 'osm_panoramax:0', osm_panoramax_0,
    -- 'osm_panoramax:1', osm_panoramax_1,
    -- 'osm_panoramax:2', osm_panoramax_2,
    -- 'osm_panoramax:3', osm_panoramax_3
    /* sql-formatter-enable */
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
  capacity_source,
  -- capacity_confidence,
  source,
  -- Road and parking specific tags
  name,
  road_width,
  -- road_width_confidence,
  road_width_source,
  road,
  operator_type,
  parking,
  orientation,
  markings,
  direction,
  reason,
  staggered,
  surface,
  -- surface_confidence,
  surface_source,
  -- Merged conditional parking categories
  condition_category,
  condition_vehicles,
  -- Base parking tags
  restriction,
  restriction_bus,
  restriction_hgv,
  restriction_reason,
  fee,
  maxstay,
  -- maxstay_motorhome,
  access,
  private,
  disabled,
  charge,
  taxi,
  motorcar,
  hgv,
  -- authentication_disc,
  -- OSM tags (preserved with osm_ prefix)
  osm_mapillary,
  -- osm_panoramax,
  -- osm_panoramax_0,
  -- osm_panoramax_1,
  -- osm_panoramax_2,
  -- osm_panoramax_3,
  -- /REMINDER
  cluster_id;
