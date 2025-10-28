DO $$ BEGIN RAISE NOTICE 'START creating kerbs %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_kerbs;

CREATE TABLE _parking_kerbs AS
SELECT
  id || '/' || kerb_sides.side AS id,
  ST_OffsetCurve (geom, kerb_sides.offset) AS geom,
  kerb_sides.side,
  kerb_sides.offset,
  osm_type,
  osm_id,
  tags ->> 'name' AS street_name,
  has_parking,
  is_driveway,
  tags,
  meta
FROM
  _parking_roads
  CROSS JOIN LATERAL (
    VALUES
      ('left', (tags ->> 'offset_left')::numeric),
      ('right', - (tags ->> 'offset_right')::numeric)
  ) AS kerb_sides ("side", "offset");

DELETE FROM _parking_kerbs
WHERE
  ST_GeometryType (geom) = 'ST_MultiLineString';

UPDATE _parking_kerbs
SET
  geom = ST_Reverse (geom)
WHERE
  side = 'right';

ALTER TABLE _parking_kerbs
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_kerbs_moved_idx ON _parking_kerbs USING BTREE (osm_id);

CREATE INDEX parking_kerbs_moved_id_idx ON _parking_kerbs USING BTREE (id);

CREATE INDEX parking_kerbs_moved_osm_id_side_idx ON _parking_kerbs USING BTREE (osm_id, side);

CREATE INDEX parking_kerbs_moved_name_side_idx ON _parking_kerbs USING BTREE (street_name, side);

CREATE INDEX parking_kerbs_moved_geom_idx ON _parking_kerbs USING GIST (geom);
