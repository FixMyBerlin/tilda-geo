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
  meta JSONB,
  -- Separate columns for frequently accessed JSONB fields
  -- We initially did this to allow combined indexes. However, those did not actually help, because only the spatial index is used in the main cutout query.
  -- However, the separate columns still have a small but measurable benefit:
  -- - JSONB parsing overhead: ~5-10% of total execution time
  -- - Column access benefit: ~2-5% performance improvement
  street_name TEXT,
  category TEXT,
  side TEXT
);

-- Create the discarded cutouts table structure
CREATE TABLE _parking_discarded_cutouts (
  id TEXT,
  osm_id BIGINT,
  geom GEOMETRY,
  tags JSONB,
  meta JSONB
);
