DO $$ BEGIN RAISE NOTICE 'START creating labels at %', clock_timestamp(); END $$;

-- Create labels for parkings
DROP TABLE IF EXISTS _parking_labels;

SELECT
  id,
  ST_LineInterpolatePoint (geom, 0.5) AS geom,
  tags ->> 'capacity' AS capacity,
  tags ->> 'area' AS area INTO _parking_labels
FROM
  parkings;

-- Create separate table for parkings_separate
DROP TABLE IF EXISTS _parking_separate_labels;

SELECT
  id,
  ST_Centroid (geom) AS geom,
  tags ->> 'capacity' AS capacity,
  tags ->> 'area' AS area INTO _parking_separate_labels
FROM
  parkings_separate;

-- MISC
ALTER TABLE _parking_labels
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_SetSRID (geom, 3857);

DROP INDEX IF EXISTS _parking_labels_geom_idx;

CREATE INDEX _parking_labels_geom_idx ON _parking_labels USING GIST (geom);

ALTER TABLE _parking_separate_labels
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_SetSRID (geom, 3857);

DROP INDEX IF EXISTS _parking_separate_labels_geom_idx;

CREATE INDEX _parking_separate_labels_geom_idx ON _parking_separate_labels USING GIST (geom);
