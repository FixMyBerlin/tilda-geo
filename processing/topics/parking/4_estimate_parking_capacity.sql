DO $$ BEGIN RAISE NOTICE 'START estimating parking capacity at %', clock_timestamp(); END $$;

-- add length and delete short parkings
ALTER TABLE _parking_parkings3_merged
ADD COLUMN length numeric;

UPDATE _parking_parkings3_merged
SET
  length = ST_Length (geom);

-- estimate capacity
ALTER TABLE _parking_parkings3_merged
ADD COLUMN capacity numeric;

UPDATE _parking_parkings3_merged
SET
  capacity = estimate_capacity (length, orientation);

DELETE FROM _parking_parkings3_merged
WHERE
  capacity < 2.5;

-- MISC
ALTER TABLE _parking_parkings3_merged
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

-- create an index on the merged table
CREATE INDEX parking_parkings3_merged_geom_idx ON _parking_parkings3_merged USING GIST (geom);

CREATE INDEX parking_parkings3_merged_osm_ids_idx ON _parking_parkings3_merged USING GIN (original_osm_ids);
