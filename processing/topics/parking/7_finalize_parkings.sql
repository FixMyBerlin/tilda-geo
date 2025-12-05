-- WHAT IT DOES:
-- Finalize parking data: transform to 3857, create final tables, indexes.
-- * Insert `parkings` table (excl `parkings_no`), reverse left side kerbs
-- * Insert `parkings_cutouts` table (excl roads, separate_parking)
-- * Insert `parkings_separate` table (minzoom 17)
-- * Create indexes for all tables
-- INPUT: `_parking_parkings_merged` (linestring), `_parking_cutouts` (polygon - buffered obstacles), `_parking_separate_parking_areas` (polygon)
-- OUTPUT: `parkings` (linestring, 3857), `parkings_cutouts` (polygon/multipolygon, 3857), `parkings_separate` (polygon, 3857)
--
DO $$ BEGIN RAISE NOTICE 'START finalize parkings at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- insert remaining parkings into the final 'parkings' table
INSERT INTO
  parkings (id, tags, meta, geom, minzoom)
SELECT
  id,
  jsonb_strip_nulls(
    tags || jsonb_build_object(
      'area',
      ROUND(NULLIF(tags ->> 'area', '')::NUMERIC, 2),
      'length',
      ROUND(length::NUMERIC, 2),
      'capacity',
      tilda_round_capacity ((tags ->> 'capacity')::NUMERIC)
    )
  ),
  '{}'::jsonb,
  ST_Transform (geom, 3857),
  0
FROM
  _parking_parkings_merged pm
WHERE
  id NOT IN (
    SELECT
      id
    FROM
      parkings_no
  );

-- reverse direction of left hand side kerbs
UPDATE parkings
SET
  geom = ST_Reverse (geom)
WHERE
  tags ->> 'side' = 'left';

-- insert all cutouts except "roads" into the final 'parkings_cutouts' table
INSERT INTO
  parkings_cutouts (id, tags, meta, geom, minzoom)
SELECT
  id,
  tags,
  meta,
  ST_Transform (geom, 3857),
  0
FROM
  _parking_cutouts pc
WHERE
  tags ->> 'source' NOT IN (
    'parking_roads',
    'separate_parking_areas',
    'separate_parking_points'
  );

INSERT INTO
  parkings_separate (id, tags, meta, geom, minzoom)
SELECT
  id,
  tags,
  meta,
  ST_Transform (geom, 3857),
  17 -- parking_separate is only visible from zoom level 17 (inclusive) onwards
FROM
  _parking_separate_parking_areas;

-- MISC
DROP INDEX IF EXISTS parkings_geom_idx;

CREATE INDEX parkings_geom_idx ON parkings USING GIST (geom);

-- DROP INDEX IF EXISTS parkings_id_idx;
CREATE UNIQUE INDEX unique_parkings_id_idx ON parkings (id);

DROP INDEX IF EXISTS parkings_no_geom_idx;

CREATE INDEX parkings_no_geom_idx ON parkings_no USING GIST (geom);

-- DROP INDEX IF EXISTS parkings_no_id_idx;
CREATE UNIQUE INDEX unique_parkings_no_id_idx ON parkings_no (id);

DROP INDEX IF EXISTS parkings_separate_geom_idx;

CREATE INDEX parkings_separate_geom_idx ON parkings_separate USING GIST (geom);

-- DROP INDEX IF EXISTS parkings_separate_id_idx;
CREATE UNIQUE INDEX unique_parkings_separate_id_idx ON parkings_separate (id);

-- ALTER TABLE parkings_cutouts
-- ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_SetSRID (geom, 3857);
DROP INDEX IF EXISTS parkings_cutouts_geom_idx;

CREATE INDEX parkings_cutouts_geom_idx ON parkings_cutouts USING GIST (geom);

-- DROP INDEX IF EXISTS parkings_cutouts_id_idx;
CREATE UNIQUE INDEX unique_parkings_cutouts_id_idx ON parkings_cutouts (id);
