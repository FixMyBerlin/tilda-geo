-- WHAT IT DOES:
-- Estimate parking capacity and area from length and orientation.
-- * Estimate area from length + orientation (only if area tag missing)
--   - Missing for: regular parkings (source='parent_highway'), separate parking areas/points after split/redistribution
--   - Already set for: separate parking areas with geometry (area_source='geometry')
--   - Note: area tags removed when split in 2_cutout_separate_parkings.sql and 3_redistribute_parking_capacities.sql
-- * Estimate capacity from length + orientation (only if capacity tag missing)
--   - Missing for: regular parkings (source='parent_highway') without OSM capacity tag, separate parking areas/points without OSM capacity tag
--   - Already set for: parkings with OSM `capacity` tag (capacity_source='tag'), separate parking areas estimated in 0_areas_project_to_kerb.sql
--   - Note: capacity redistributed (not removed) when split in 3_redistribute_parking_capacities.sql
-- * Adjust capacity for staggered parking (50% reduction + maneuvering loss)
-- INPUT/OUTPUT: `_parking_parkings_merged` (linestring) - the table is replaced by a new one with the estimates
--
DO $$ BEGIN RAISE NOTICE 'START estimating parking capacity at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- All estimates are calculated in one pass and written to a new table that replaces `_parking_parkings_merged`.
-- The CTEs follow the order of the list at the top of this file.
CREATE TABLE _parking_parkings_merged_estimated AS
WITH
  -- Length, plus area and capacity as estimated from length + orientation
  estimates AS (
    SELECT
      pm.*,
      measured.length,
      tilda_estimate_area (
        length := measured.length,
        orientation := pm.tags ->> 'orientation'
      ) AS estimated_area,
      tilda_estimate_capacity (
        length := measured.length,
        orientation := pm.tags ->> 'orientation'
      ) AS estimated_capacity,
      -- We only support parallel parking for now.
      (
        pm.tags ->> 'staggered' = 'yes'
        AND pm.tags ->> 'orientation' = 'parallel'
      ) IS TRUE AS is_staggered
    FROM
      _parking_parkings_merged pm
      CROSS JOIN LATERAL (
        SELECT
          ST_Length (pm.geom)::NUMERIC AS length
      ) AS measured
  ),
  -- Use the estimated area where the area tag is missing
  with_area AS (
    SELECT
      id,
      cluster_id,
      original_ids,
      meta,
      path,
      geom,
      length,
      estimated_area,
      estimated_capacity,
      is_staggered,
      CASE
        WHEN tags ->> 'area' IS NULL THEN tags || jsonb_build_object(
          /* sql-formatter-disable */
          'area', estimated_area,
          'area_source', 'estimated',
          'area_confidence', 'medium'
          /* sql-formatter-enable */
        )
        ELSE tags
      END AS tags
    FROM
      estimates
  ),
  -- Special treatment for `staggered=yes` and `parking=parallel`
  -- Docs: https://wiki.openstreetmap.org/wiki/Key:parking:both:staggered
  -- In general, staggered parking allows to use half of the parking spaces.
  -- However, we have to adjust for the maneuvering space when the parking side changes.
  -- We assume that for every 60m (~11.5 cars) the side might change and that 10m are needed for maneuvering.
  -- Calculation: 50% capacity reduction + maneuvering space loss
  -- 1. Apply 50% reduction: estimated_capacity * 0.5
  -- 2. Subtract maneuvering space: FLOOR(length/60) * (10m / 5.2m per car)
  -- Example:
  -- - Segments: FLOOR(120/60) = 2
  -- - Maneuvering loss: 2 * 10 / 5.2 ≈ 3.8 cars
  -- - Staggered capacity: (20 * 0.5) - 3.8 = 10 - 3.8 = 6.2 cars
  with_staggered AS (
    SELECT
      id,
      cluster_id,
      original_ids,
      meta,
      path,
      geom,
      length,
      estimated_area,
      CASE
        WHEN is_staggered THEN (estimated_capacity * 0.5) - (FLOOR(length / 60.0) * 10.0 / 5.2)
        ELSE estimated_capacity
      END AS estimated_capacity,
      CASE
        WHEN is_staggered THEN tags || jsonb_build_object(
          /* sql-formatter-disable */
          '_staggered_original_capacity', ROUND(estimated_capacity, 2),
          '_staggered_maneuvering_loss', ROUND(FLOOR(length / 60.0) * 10.0 / 5.2, 2)
          /* sql-formatter-enable */
        )
        ELSE tags
      END AS tags
    FROM
      with_area
  )
-- Use the estimated capacity where the capacity tag is missing
SELECT
  id,
  cluster_id,
  CASE
    WHEN tags ->> 'capacity' IS NULL THEN tags || jsonb_build_object(
      /* sql-formatter-disable */
      'capacity', estimated_capacity,
      'capacity_source', 'estimated_from_length',
      'capacity_confidence', 'medium'
      /* sql-formatter-enable */
    )
    ELSE tags
  END AS tags,
  original_ids,
  meta,
  path,
  geom,
  length,
  estimated_area,
  estimated_capacity
FROM
  with_staggered;

DROP TABLE _parking_parkings_merged;

ALTER TABLE _parking_parkings_merged_estimated
RENAME TO _parking_parkings_merged;

CREATE INDEX _parking_parkings_merged_id_idx ON _parking_parkings_merged USING BTREE (id);

CREATE INDEX parking_parkings_merged_geom_idx ON _parking_parkings_merged USING GIST (geom);

DO $$ BEGIN RAISE NOTICE 'END estimating parking capacity at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
