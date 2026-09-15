-- WHAT IT DOES:
-- Build a short line from a road vertex, perpendicular to the road, of the given length.
-- * Looks up `_parking_roads` by osm_id, takes ST_PointN(idx), turns azimuth 90°
-- USED IN: `crossings/2_points_create_crossings.sql`
DROP FUNCTION IF EXISTS tilda_estimate_road_crossing;

CREATE FUNCTION tilda_estimate_road_crossing (road_id BIGINT, idx INTEGER, length NUMERIC) RETURNS geometry AS $$
DECLARE
  road_geom geometry;
  point_geom geometry;
  azimuth double precision;
BEGIN
  SELECT geom INTO road_geom FROM _parking_roads WHERE osm_id = road_id;

  point_geom := ST_PointN(road_geom, idx);

  azimuth := tilda_line_azimuth_at_index(road_geom, idx, 1) - pi() / 2 ;

  RETURN ST_MakeLine(point_geom, ST_Project(point_geom, length, azimuth));
END;
$$ LANGUAGE plpgsql STABLE;
