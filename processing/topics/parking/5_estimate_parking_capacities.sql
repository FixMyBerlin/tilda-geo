DO $$ BEGIN RAISE NOTICE 'START estimating parking capacity at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- add length and delete short parkings
ALTER TABLE _parking_parkings_merged
ADD COLUMN length numeric;

UPDATE _parking_parkings_merged
SET
  length = ST_Length (geom);

-- estimate area
ALTER TABLE _parking_parkings_merged
ADD COLUMN estimated_area numeric;

UPDATE _parking_parkings_merged
SET
  estimated_area = estimate_area (
    length := length,
    orientation := tags ->> 'orientation'
  );

UPDATE _parking_parkings_merged pm
SET
  tags = tags || jsonb_build_object('area', estimated_area) || '{"area_source": "estimated", "area_confidence": "medium"}'::JSONB
WHERE
  tags ->> 'area' IS NULL;

-- estimate capacity
ALTER TABLE _parking_parkings_merged
ADD COLUMN estimated_capacity numeric;

UPDATE _parking_parkings_merged
SET
  estimated_capacity = estimate_capacity_from_area (
    area := (tags ->> 'area')::NUMERIC,
    orientation := tags ->> 'orientation'
  )
WHERE
  tags ->> 'source' = 'separate_parking_areas'
  AND tags ->> 'area_source' = 'geometry';

UPDATE _parking_parkings_merged pm
SET
  tags = tags || jsonb_build_object('capacity', estimated_capacity) || '{"capacity_source": "estimated_from_area", "capacity_confidence": "medium"}'::JSONB
WHERE
  tags ->> 'capacity' IS NULL
  AND estimated_capacity IS NOT NULL;

UPDATE _parking_parkings_merged
SET
  estimated_capacity = estimate_capacity (
    length := length,
    orientation := tags ->> 'orientation'
  );

-- Special treatment for `staggered=yes` and `parking=parallel`
-- (We only support parallel parking for now.)
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
UPDATE _parking_parkings_merged
SET
  estimated_capacity = (estimated_capacity * 0.5) - (FLOOR(length / 60.0) * 10.0 / 5.2),
  tags = tags || jsonb_build_object(
    /* sql-formatter-disable */
    -- 'capacity_source', 'estimated_from_length_staggered',
    -- 'capacity_confidence', 'medium',
    '_staggered_original_capacity', estimated_capacity,
    '_staggered_maneuvering_loss', FLOOR(length / 60.0) * 10.0 / 5.2
    /* sql-formatter-enable */
  )
WHERE
  tags ->> 'staggered' = 'yes'
  AND tags ->> 'orientation' = 'parallel';

UPDATE _parking_parkings_merged pm
SET
  tags = tags || jsonb_build_object('capacity', estimated_capacity) || '{"capacity_source": "estimated_from_length", "capacity_confidence": "medium"}'::JSONB
WHERE
  tags ->> 'capacity' IS NULL;

-- MISC
ALTER TABLE _parking_parkings_merged
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
