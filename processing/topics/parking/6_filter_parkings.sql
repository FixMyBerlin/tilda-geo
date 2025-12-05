-- WHAT IT DOES:
-- Filter invalid parkings into `parkings_no` table.
-- * Filter parking='no'/'separate'/'not_expected'
-- * Filter parking='missing'
-- * Filter capacity < 1
-- * Round capacity values
-- INPUT: `_parking_parkings_merged` (linestring)
-- OUTPUT: `parkings_no` (multilinestring, 3857)
--
DO $$ BEGIN RAISE NOTICE 'START filter parkings %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- filter parkings that don't allow parking (except missing)
CREATE INDEX IF NOT EXISTS parking_parkings_merged_parking_tag_idx ON _parking_parkings_merged ((tags ->> 'parking'));

INSERT INTO
  parkings_no (id, tags, meta, geom, minzoom)
SELECT
  id,
  CASE
    WHEN p.tags ->> 'restriction' = 'no_parking' THEN tags || jsonb_build_object(
      /* sql-formatter-disable */
      'parking', 'no_parking',
      'reason', 'restriction_no_parking'
      /* sql-formatter-enable */
    )
    WHEN p.tags ->> 'restriction' = 'no_stopping' THEN tags || jsonb_build_object(
      /* sql-formatter-disable */
      'parking', 'no_stopping',
      'reason', 'restriction_no_stopping'
      /* sql-formatter-enable */
    )
    ELSE tags || '{"reason": "parking_tag"}'::JSONB
  END,
  '{}'::JSONB,
  ST_Transform (geom, 3857),
  0
FROM
  _parking_parkings_merged p
WHERE
  p.tags ->> 'parking' IN ('no', 'separate', 'not_expected');

-- filter parkings with missing data
INSERT INTO
  parkings_no (id, tags, meta, geom, minzoom)
SELECT
  id,
  tags || '{"reason": "missing_data"}'::JSONB,
  '{}'::JSONB,
  ST_Transform (geom, 3857),
  0
FROM
  _parking_parkings_merged p
WHERE
  p.tags ->> 'parking' = 'missing';

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
