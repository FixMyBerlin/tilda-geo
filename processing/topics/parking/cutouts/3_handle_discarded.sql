-- WHAT IT DOES:
-- Move discarded cutouts from `_parking_cutouts` to `_parking_discarded_cutouts` table.
-- * Discard tag set in: `obstacles/1_filter_points.sql` (bus stops with explicit parking), `obstacles_unprojected/0_filter_turning_circles.sql` (turning circles with parking=no)
-- * Move cutouts with `tags->>'discard' = true` to discarded table
-- * Remove discarded cutouts from main table (kept for debugging)
-- INPUT: `_parking_cutouts` (with discard tag set in other files)
-- OUTPUT: `_parking_cutouts` (cleaned), `_parking_discarded_cutouts` (discarded items)
--
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
