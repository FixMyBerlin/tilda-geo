DO $$ BEGIN RAISE NOTICE 'START filter parkings %', clock_timestamp(); END $$;

-- filter parkings that don't allow parking
INSERT INTO
  parkings_no (id, tags, meta, geom, minzoom)
SELECT
  id,
  tags || '{"reason": "parking_tag"}'::JSONB,
  '{}'::JSONB,
  ST_Transform (geom, 3857),
  0
FROM
  _parking_parkings_merged p
WHERE
  p.tags ->> 'parking' IN (
    'no',
    'separate',
    'not_expected',
    'missing',
    'separate'
  );

CREATE UNIQUE INDEX parkings_no_id_idx ON parkings_no USING BTREE (id);

-- filter parkings with capacity < 1
INSERT INTO
  parkings_no (id, tags, meta, geom, minzoom)
SELECT
  id,
  tags || '{"reason": "capacity_below_zero"}'::JSONB,
  '{}'::JSONB,
  ST_Transform (geom, 3857),
  0
FROM
  _parking_parkings_merged
WHERE
  (tags ->> 'capacity')::NUMERIC < 1
ON CONFLICT (id) DO NOTHING;

UPDATE parkings_no
SET
  tags = tags || jsonb_build_object(
    'capacity',
    ROUND((tags ->> 'capacity')::NUMERIC, 2)
  );
