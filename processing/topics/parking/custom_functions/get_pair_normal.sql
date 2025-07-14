DROP FUNCTION IF EXISTS get_pair_normal;

CREATE FUNCTION get_pair_normal (a geometry, b geometry, len float) RETURNS geometry AS $$
DECLARE
  normal_azimuth double precision ;
  midpoint geometry;
  startpoint geometry;
  endpoint geometry;
BEGIN

  -- get the normals azimuth
  normal_azimuth := ST_Azimuth(a, b) + pi() / 2;
  midpoint  := ST_Centroid(ST_Union(a, b));

  -- Create start and end point of the normal vector using length and angle
  startpoint := ST_Project(midpoint, 0.1, normal_azimuth);
  endpoint := ST_Project(midpoint, len, normal_azimuth);

  -- Return line from midpoint to normal endpoint
  RETURN ST_MakeLine(startpoint, endpoint);
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;
