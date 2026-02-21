-- WHAT IT DOES:
-- Create kerb lines from road centerlines by offsetting to left and right sides.
-- * Offset road centerlines using `ST_OffsetCurve` and split each road into two kerbs (left: positive offset, right: negative offset)
-- * Reverse right side kerbs for consistent direction
-- * Filter: remove MultiLineString geometries (moved to `_parking_kerbs_errors` table for debugging when ST_OffsetCurve creates discontinuous offset curves)
-- INPUT: `_parking_roads` (linestring)
-- OUTPUT: `_parking_kerbs` (linestring), `_parking_kerbs_errors` (MultiLineString geometries that cannot be processed)
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

-- Filter: remove MultiLineString geometries
-- `ST_OffsetCurve` can create MultiLineString when offset curve becomes discontinuous (e.g., sharp turns, complex geometry, large offset relative to curvature).
-- We can only handle LineString geometries for kerbs, so move MultiLineString cases to `_parking_kerbs_errors` table for debugging.
--
-- CONSEQUENCES when kerbs are removed (MultiLineString → _parking_kerbs_errors):
-- * Road parkings: no kerb geom (JOIN in parkings/0_add_kerb_geoms.sql finds no match). In 1_cutout_road_parkings.sql ST_Dump(NULL) yields no rows → dropped, not in final `parkings`.
-- * Separate parking points: no match from tilda_project_to_k_closest_kerbs → excluded in separate_parkings/0_points_project_to_kerb.sql, not in final data.
-- * Separate parking areas: unaffected (geometry from polygon via tilda_parking_area_to_line).
-- * Other consumers of _parking_kerbs (obstacles, public_transport, crossings, driveway_corner_kerbs, intersection_corners): no geometry for those segments.
DO $$
DECLARE
  multiline_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO multiline_count
  FROM _parking_kerbs
  WHERE ST_GeometryType (geom) = 'ST_MultiLineString';

  IF multiline_count > 0 THEN
    RAISE NOTICE '[WARNING] Removing % way segments (MultiLineString kerb geometries created by ST_OffsetCurve due to discontinuous offset curves). We cannot handle those, so we move them to `_parking_kerbs_errors` table for debugging. Consequences: no road parking lines for those segments; separate parking points that would snap to these kerbs are excluded; final data will not include those ways.', multiline_count;
  END IF;
END $$;

-- Create error table for MultiLineString geometries that cannot be processed
DROP TABLE IF EXISTS _parking_kerbs_errors;

CREATE TABLE _parking_kerbs_errors AS
SELECT
  *
FROM
  _parking_kerbs
WHERE
  ST_GeometryType (geom) = 'ST_MultiLineString';

DELETE FROM _parking_kerbs
WHERE
  ST_GeometryType (geom) = 'ST_MultiLineString';

UPDATE _parking_kerbs
SET
  geom = ST_Reverse (geom)
WHERE
  side = 'right';
