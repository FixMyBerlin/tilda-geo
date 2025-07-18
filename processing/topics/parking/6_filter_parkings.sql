-- filter parkings that don't allow parking
SELECT
  id INTO TEMP TABLE parking_prohibited
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

CREATE INDEX parking_prohibited_id_idx ON parking_prohibited USING btree (id);

INSERT INTO
  parkings_no (osm_type, osm_id, id, tags, meta, geom, minzoom)
SELECT
  'c',
  0,
  id,
  tags || '{"reason": "parking_tag"}'::JSONB,
  '{}'::JSONB,
  ST_Transform (geom, 3857),
  0
FROM
  _parking_parkings_merged p
WHERE
  id IN (
    SELECT
      id
    FROM
      parking_prohibited
  );

DELETE FROM _parking_parkings_merged
WHERE
  id IN (
    SELECT
      id
    FROM
      parking_prohibited
  );

-- filter parkings with capacity < 1
SELECT
  id INTO TEMP capacity_too_low
FROM
  _parking_parkings_merged
WHERE
  (tags ->> 'capacity')::NUMERIC < 1;

CREATE INDEX parking_discarded_idx ON capacity_too_low USING BTREE (id);

INSERT INTO
  parkings_no (osm_type, osm_id, id, tags, meta, geom, minzoom)
SELECT
  'c',
  0,
  id,
  tags || '{"reason": "capacity < 1"}'::JSONB,
  '{}'::JSONB,
  ST_Transform (geom, 3857),
  0
FROM
  _parking_parkings_merged
WHERE
  id IN (
    SELECT
      id
    FROM
      capacity_too_low
  );

DELETE FROM _parking_parkings_merged
WHERE
  id IN (
    SELECT
      id
    FROM
      capacity_too_low
  );
