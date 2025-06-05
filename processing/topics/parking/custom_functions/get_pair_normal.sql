CREATE OR REPLACE FUNCTION get_pair_normal (a geometry, b geometry, len float) RETURNS geometry AS $$
DECLARE
  normal_azimuth double precision := ST_Azimuth(a, b) + pi() / 2;
  midpoint geometry := ST_Centroid(ST_Union(a, b));
  endpoint geometry;
BEGIN

  -- Create endpoint of the normal vector using length and angle
  endpoint := ST_Project(midpoint, len, normal_azimuth);

  -- Return line from midpoint to normal endpoint
  RETURN ST_MakeLine(midpoint, endpoint);
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;
