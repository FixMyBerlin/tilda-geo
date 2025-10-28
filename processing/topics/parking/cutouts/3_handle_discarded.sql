DO $$ BEGIN RAISE NOTICE 'START handling discarded cutouts at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- Create index for efficient discard operations
CREATE INDEX parking_cutouts_discard_idx ON _parking_cutouts (((tags ->> 'discard')::BOOLEAN));

-- Move discarded cutouts to separate table
INSERT INTO
  _parking_discarded_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id,
  osm_id,
  geom,
  tags,
  meta
FROM
  _parking_cutouts c
WHERE
  (tags ->> 'discard')::BOOLEAN;

-- Remove discarded cutouts from main table
DELETE FROM _parking_cutouts c
WHERE
  (tags ->> 'discard')::BOOLEAN;
