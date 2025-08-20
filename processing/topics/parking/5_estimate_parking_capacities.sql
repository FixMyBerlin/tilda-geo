DO $$ BEGIN RAISE NOTICE 'START estimating parking capacity at %', clock_timestamp(); END $$;

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
  estimated_area = estimate_area (length, tags ->> 'orientation');

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
  estimated_capacity = estimate_capacity (length, tags ->> 'orientation');

UPDATE _parking_parkings_merged pm
SET
  tags = tags || jsonb_build_object('capacity', estimated_capacity) || '{"capacity_source": "estimated", "capacity_confidence": "medium"}'::JSONB
WHERE
  tags ->> 'capacity' IS NULL;

-- MISC
ALTER TABLE _parking_parkings_merged
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
