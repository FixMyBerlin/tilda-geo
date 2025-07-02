--
DROP FUNCTION IF EXISTS kerb_tangent;

CREATE FUNCTION kerb_tangent (
  road_id BIGINT,
  idx INTEGER,
  side TEXT,
  direction INTEGER,
  length INTEGER
) RETURNS geometry AS $$
DECLARE
  road_geom geometry;
  kerb_geom geometry;
  point_geom geometry;
  azimuth double precision;
BEGIN
  SELECT geom INTO road_geom FROM _parking_roads WHERE osm_id = road_id;
  SELECT geom INTO kerb_geom FROM _parking_kerbs WHERE osm_id = road_id AND _parking_kerbs.side = kerb_tangent.side;
  point_geom := ST_ClosestPoint(kerb_geom, ST_PointN(road_geom, idx));

  IF side = 'right' THEN
    azimuth := line_azimuth_at_index(road_geom, idx, direction);
  ELSIF side = 'left' THEN
    azimuth := line_azimuth_at_index(road_geom, idx, -direction);
  ELSE
    RAISE EXCEPTION '"side" must be "left" or "right", got: %', direction;
  END IF;
  RETURN ST_MakeLine(point_geom, ST_Project(point_geom, length, azimuth));
END;
$$ LANGUAGE plpgsql STABLE;
