DO $$ BEGIN RAISE NOTICE 'START creating cutout indexes at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- Create spatial index for geometry operations
CREATE INDEX parking_cutout_areas_geom_idx ON _parking_cutouts USING GIST (geom);

-- Create unique index on id
CREATE UNIQUE INDEX parking_cutouts_id_idx ON _parking_cutouts (id);

-- NOTE TODO: Test those new indexes for performance improvements
-- CREATE INDEX parking_cutouts_geom_highway_busstop_idx ON _parking_cutouts USING GIST (geom) INCLUDE ((tags ->> 'highway'), (tags ->> 'bus_stop'));
--
-- Create index on street name for filtering
CREATE INDEX parking_cutouts_street_name_idx ON _parking_cutouts ((tags ->> 'street:name'));

-- Create index on source for filtering
CREATE INDEX parking_cutouts_source_idx ON _parking_cutouts ((tags ->> 'source'));

-- Create index on discard flag for filtering
CREATE INDEX parking_cutouts_discard_idx ON _parking_cutouts (((tags ->> 'discard')::BOOLEAN));

-- Set SRID for geometry columns
ALTER TABLE _parking_cutouts
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

ALTER TABLE _parking_discarded_cutouts
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
