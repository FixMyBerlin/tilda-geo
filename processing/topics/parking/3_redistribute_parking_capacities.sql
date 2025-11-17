-- WHAT IT DOES:
-- Redistribute parking capacities proportionally after parkings are split (e.g., by cutouts).
-- * Snap geometries to grid using `ST_SnapToGrid` to reduce precision issues
-- * Delete zero-length geometries using `ST_Length` (invalid after cutouts)
-- * Redistribute capacity proportionally: original_capacity * (segment_length / total_length)
-- * Remove area tags (no longer accurate after splitting)
-- INPUT: `_parking_parkings_cutted` (linestring) - parkings after cutouts
-- OUTPUT: `_parking_parkings_cutted` (updated in-place with redistributed capacities)
--
DO $$ BEGIN RAISE NOTICE 'START redistributing parking capacities at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

UPDATE _parking_parkings_cutted
SET
  geom = ST_SnapToGrid (geom, 0.1);

-- Delete all parking lots where the length of the geometry is zero
-- Zero-length geometries can occur when:
-- 1. A cutout (e.g., bus stop, driveway) completely removes a segment: `ST_Difference` in `1_cutout_road_parkings.sql` can result in empty geometries
-- 2. After `ST_SnapToGrid`: Very small segments (< 0.1 units) may snap to the same point, creating zero-length linestrings
-- 3. When `ST_Dump` splits a parking and one of the resulting segments has no length
-- These are invalid for capacity calculations and must be removed
DELETE FROM _parking_parkings_cutted
WHERE
  ST_Length (geom) = 0;

-- Then we redistribute the parking capacities based on the length of the geometry and the original capacity.
-- This is done by calculating the total length of all geometries with the same id and then redistributing the capacity proportionally for each geometry.
WITH
  total_lengths AS (
    SELECT
      original_id,
      SUM(ST_Length (geom)) AS length,
      COUNT(*) AS count
    FROM
      _parking_parkings_cutted
    WHERE
      -- Only process parkings that have a capacity tag (need to redistribute existing capacity)
      tags ? 'capacity'
    GROUP BY
      original_id
  )
UPDATE _parking_parkings_cutted pc
SET
  -- Remove area tags since they're no longer accurate after splitting
  tags = tags - ARRAY['area', 'area_source', 'area_confidence'] || jsonb_build_object(
    -- Redistribute capacity proportionally
    /* sql-formatter-disable */
    'capacity', (tags ->> 'capacity')::NUMERIC * ST_Length (pc.geom) / tl.length,
    'capacity_source', tags ->> 'capacity_source' || '_redistributed'
    /* sql-formatter-enable */
  )
FROM
  total_lengths tl
WHERE
  tl.count > 1
  AND pc.original_id = tl.original_id;
