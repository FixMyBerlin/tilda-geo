-- add length and delete short parkings
ALTER TABLE parkings_merged
ADD COLUMN length numeric;

UPDATE parkings_merged
SET
  length = ST_Length (geom);

DELETE FROM parkings_merged
WHERE
  length < 2.5;

-- estimate capacity
ALTER TABLE parkings_merged
ADD COLUMN capacity numeric;

UPDATE parkings_merged
SET
  capacity = estimate_capacity (length, orientation);

-- MISC
ALTER TABLE parkings_merged
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

-- create an index on the merged table
CREATE INDEX parkings_merged_geom_idx ON parkings_merged USING GIST (geom);

CREATE INDEX parkings_merged_idx ON parkings_merged USING GIN (original_osm_ids);
