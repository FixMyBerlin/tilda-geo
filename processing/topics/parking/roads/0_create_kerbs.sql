-- WHAT IT DOES:
-- Create kerb lines from road centerlines by offsetting to left and right sides.
-- * Offset road centerlines using `ST_OffsetCurve` and split each road into two kerbs (left: positive offset, right: negative offset)
-- * Reverse right side kerbs for consistent direction
-- * When ST_OffsetCurve returns MultiLineString: keep longest segment in `_parking_kerbs`; copy full geom to `_parking_kerbs_errors` with tags._NOTE for debugging
-- INPUT: `_parking_roads` (linestring)
-- OUTPUT: `_parking_kerbs` (linestring), `_parking_kerbs_errors` (MultiLineString rows with _NOTE)
--
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
  is_parking_road,
  tags,
  meta
FROM
  _parking_roads
  CROSS JOIN LATERAL (
    VALUES
      ('left', (tags ->> 'offset_left')::numeric),
      ('right', - (tags ->> 'offset_right')::numeric)
  ) AS kerb_sides ("side", "offset");

ALTER TABLE _parking_kerbs
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX _parking_kerbs_osm_id_idx ON _parking_kerbs USING BTREE (osm_id);

CREATE INDEX _parking_kerbs_id_idx ON _parking_kerbs USING BTREE (id);

CREATE INDEX _parking_kerbs_osm_id_side_idx ON _parking_kerbs USING BTREE (osm_id, side);

CREATE INDEX _parking_kerbs_street_name_side_idx ON _parking_kerbs USING BTREE (street_name, side);

CREATE INDEX _parking_kerbs_geom_idx ON _parking_kerbs USING GIST (geom);

-- MultiLineString handling
-- `ST_OffsetCurve` can create MultiLineString when offset curve becomes discontinuous (e.g., sharp turns, complex geometry, large offset relative to curvature).
-- We can only handle LineString geometries for kerbs, so we keep the longest segment in `_parking_kerbs` and copy the full MultiLineString to `_parking_kerbs_errors` for debugging (tags._NOTE explains).
-- CONSEQUENCES for the omitted (shorter) segments: no road parking lines there; separate parking points that would snap to those parts are excluded; obstacles/crossings/driveway_corner_kerbs have no geometry for those segments.
DO $$
DECLARE
  multiline_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO multiline_count
  FROM _parking_kerbs
  WHERE ST_GeometryType (geom) = 'ST_MultiLineString';

  IF multiline_count > 0 THEN
    RAISE NOTICE '[WARNING] % way segments have MultiLineString kerb geometries. Keeping longest segment; full geom in _parking_kerbs_errors.', multiline_count;
  END IF;
END $$;

-- Copy full MultiLineString rows to error table for debugging
DROP TABLE IF EXISTS _parking_kerbs_errors;

CREATE TABLE _parking_kerbs_errors AS
SELECT
  k.id,
  k.side,
  k.offset,
  k.osm_type,
  k.osm_id,
  k.street_name,
  k.has_parking,
  k.is_driveway,
  k.is_parking_road,
  k.tags || '{"_NOTE": "MultiLineString: kept longest segment in _parking_kerbs; this row has full geom for debugging"}'::jsonb AS tags,
  k.meta,
  k.geom
FROM
  _parking_kerbs k
WHERE
  ST_GeometryType (k.geom) = 'ST_MultiLineString';

-- Insert one row per MultiLineString: same attributes, geom = longest segment (so we keep usable kerb)
INSERT INTO
  _parking_kerbs (
    id,
    side,
    "offset",
    osm_type,
    osm_id,
    street_name,
    has_parking,
    is_driveway,
    is_parking_road,
    tags,
    meta,
    geom
  )
SELECT
  k.id,
  k.side,
  k.offset,
  k.osm_type,
  k.osm_id,
  k.street_name,
  k.has_parking,
  k.is_driveway,
  k.is_parking_road,
  k.tags,
  k.meta,
  longest.geom
FROM
  _parking_kerbs k
  CROSS JOIN LATERAL (
    SELECT
      d.geom
    FROM
      ST_Dump (k.geom) AS d (path, geom)
    ORDER BY
      ST_Length (d.geom) DESC
    LIMIT
      1
  ) AS longest
WHERE
  ST_GeometryType (k.geom) = 'ST_MultiLineString';

-- Remove MultiLineString rows (we already inserted the longest segment for each)
DELETE FROM _parking_kerbs
WHERE
  ST_GeometryType (geom) = 'ST_MultiLineString';

UPDATE _parking_kerbs
SET
  geom = ST_Reverse (geom)
WHERE
  side = 'right';

DO $$ BEGIN RAISE NOTICE 'END creating kerbs at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
