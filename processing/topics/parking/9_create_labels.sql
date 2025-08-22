DO $$ BEGIN RAISE NOTICE 'START creating labels at %', clock_timestamp(); END $$;

-- parkings_labels
INSERT INTO
  parkings_labels (id, geom, tags, meta, minzoom)
SELECT
  id,
  ST_LineInterpolatePoint (geom, 0.5) AS geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'capacity', tags ->> 'capacity',
    'operator_type', tags ->> 'operator_type',
    'area', ROUND(NULLIF(tags->>'area','')::numeric, 2)
    /* sql-formatter-enable */
  ) AS tags,
  '{}'::jsonb AS meta,
  14 AS minzoom -- visible from z14+
FROM
  parkings;

DROP INDEX IF EXISTS parkings_labels_geom_idx;

CREATE INDEX parkings_labels_geom_idx ON parkings_labels USING GIST (geom);

-- parkings_separate_labels
INSERT INTO
  parkings_separate_labels (id, geom, tags, meta, minzoom)
SELECT
  id,
  ST_PointOnSurface (geom) AS geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'capacity', tags ->> 'capacity',
    'operator_type', tags ->> 'operator_type',
    'area', ROUND(NULLIF(tags->>'area','')::numeric, 2)
    /* sql-formatter-enable */
  ) AS tags,
  '{}'::jsonb AS meta,
  14 AS minzoom -- visible from z14+
FROM
  parkings_separate;

DROP INDEX IF EXISTS parkings_separate_labels_geom_idx;

CREATE INDEX parkings_separate_labels_geom_idx ON parkings_separate_labels USING GIST (geom);
