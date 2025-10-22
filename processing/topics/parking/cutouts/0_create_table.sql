DO $$ BEGIN RAISE NOTICE 'START creating cutout tables at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS _parking_cutouts;

DROP TABLE IF EXISTS _parking_discarded_cutouts;

-- Create the main cutouts table structure
CREATE TABLE _parking_cutouts (
  id TEXT,
  osm_id BIGINT,
  geom GEOMETRY,
  tags JSONB,
  meta JSONB
);

-- Create the discarded cutouts table structure
CREATE TABLE _parking_discarded_cutouts (
  id TEXT,
  osm_id BIGINT,
  geom GEOMETRY,
  tags JSONB,
  meta JSONB
);
