-- WHAT IT DOES:
-- Generate evenly spaced points along a linestring representing individual parking spaces.
-- * Divides linestring into capacity number of segments, returns point at center of each segment
-- * Used for visualization/labeling individual parking spaces
-- USED IN: `7_finalize_parkings.sql` (create point geometries for individual parking spaces)
DROP FUNCTION IF EXISTS explode_parkings;

CREATE FUNCTION explode_parkings (geom geometry, capacity integer) RETURNS SETOF geometry AS $$
DECLARE
  i integer;
  spacing float;
  rel_position float;
BEGIN
  IF capacity <= 0 THEN
    RETURN;
  END IF;

  spacing := 1.0 / capacity;

  FOR i IN 0..capacity - 1 LOOP
    -- calculate fraction: half-spacing from start + i*spacing
    rel_position := (spacing / 2.0) + (i * spacing);

    -- ensure rel_positiontion is within [0,1]
    rel_position := LEAST(1.0, GREATEST(0.0, rel_position));

    RETURN NEXT ST_LineInterpolatePoint(geom, rel_position);
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
