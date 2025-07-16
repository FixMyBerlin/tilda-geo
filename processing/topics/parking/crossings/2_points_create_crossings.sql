DO $$ BEGIN RAISE NOTICE 'START creating kerb tangents %', clock_timestamp(); END $$;

--
CREATE OR REPLACE FUNCTION estimate_road_crossing (road_id BIGINT, idx INTEGER, length NUMERIC) RETURNS geometry AS $$
DECLARE
  road_geom geometry;
  point_geom geometry;
  azimuth double precision;
BEGIN
  SELECT geom INTO road_geom FROM _parking_roads WHERE osm_id = road_id;

  point_geom := ST_PointN(road_geom, idx);

  azimuth := line_azimuth_at_index(road_geom, idx, 1) - pi() / 2 ;

  RETURN ST_MakeLine(point_geom, ST_Project(point_geom, length, azimuth));
END;
$$ LANGUAGE plpgsql STABLE;

-- CLEANUP
DROP TABLE IF EXISTS _parking_crossings;

-- INSERT "parking_crossings" from located crossing points
SELECT
  opl.id,
  opl.osm_id,
  Null as way_id,
  opl.tags || '{"geometry_source": "generated"}'::jsonb AS tags,
  opl.meta,
  -- we increase this length to be safe when we project on to the real crossing geometry
  ABS(k.offset) + 1 as length,
  estimate_road_crossing (opl.way_id, opl.idx, k.offset * 3) as geom
  --
  INTO _parking_crossings
FROM
  _parking_crossing_points_located opl
  JOIN _parking_kerbs k ON way_id = k.osm_id
  AND opl.tags ->> 'side' = k.side;

-- MISC
ALTER TABLE _parking_crossings
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
