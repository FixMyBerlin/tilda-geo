DO $$ BEGIN RAISE NOTICE 'START creating cutout indexes at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- Create spatial index for geometry operations
-- Based on EXPLAIN ANALYZE analysis:
-- Only the spatial index is used in the main cutout query
-- Individual column indexes and composite index are NOT used
-- The spatial index efficiently handles geometry intersection, then filtering is applied
CREATE INDEX parking_cutout_areas_geom_idx ON _parking_cutouts USING GIST (geom);

-- Create unique index on id
CREATE UNIQUE INDEX parking_cutouts_id_idx ON _parking_cutouts (id);

-- Set SRID for geometry columns
ALTER TABLE _parking_cutouts
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

ALTER TABLE _parking_discarded_cutouts
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
