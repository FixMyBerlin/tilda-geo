-- Area parts: `geom` (multipolygon, 3857) cut across its long axis into two parts (min end, max end);
-- the first part gets `share` of the long axis. Works in EPSG:5243: the outline is rotated so that its
-- oriented envelope's long axis is the x axis, cut at x, and the parts are rotated back.
-- Always two parts: a degenerate outline (no area) gives the outline twice.
CREATE OR REPLACE FUNCTION tilda_bicycle_parking_split_area(geom geometry, share DOUBLE PRECISION)
RETURNS geometry[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  margin CONSTANT DOUBLE PRECISION := 1;
  outline geometry;
  envelope geometry;
  ring geometry;
  edge_length DOUBLE PRECISION;
  longest_length DOUBLE PRECISION := 0;
  axis_angle DOUBLE PRECISION := 0;
  centre geometry;
  rotated geometry;
  x_min DOUBLE PRECISION;
  x_max DOUBLE PRECISION;
  y_min DOUBLE PRECISION;
  y_max DOUBLE PRECISION;
  cut DOUBLE PRECISION;
BEGIN
  outline := ST_CollectionExtract(ST_MakeValid(ST_Transform(geom, 5243)), 3);
  envelope := ST_OrientedEnvelope(outline);
  IF COALESCE(ST_Area(outline), 0) <= 0 OR GeometryType(envelope) IS DISTINCT FROM 'POLYGON' THEN
    RETURN ARRAY[geom, geom];
  END IF;

  -- The long axis of the oriented envelope: its longest edge.
  ring := ST_ExteriorRing(envelope);
  FOR i IN 1..4 LOOP
    edge_length := ST_Distance(ST_PointN(ring, i), ST_PointN(ring, i + 1));
    IF edge_length > longest_length THEN
      longest_length := edge_length;
      axis_angle := ATAN2(
        ST_Y(ST_PointN(ring, i + 1)) - ST_Y(ST_PointN(ring, i)),
        ST_X(ST_PointN(ring, i + 1)) - ST_X(ST_PointN(ring, i))
      );
    END IF;
  END LOOP;

  centre := ST_Centroid(outline);
  rotated := ST_Rotate(outline, -axis_angle, centre);
  x_min := ST_XMin(rotated);
  x_max := ST_XMax(rotated);
  y_min := ST_YMin(rotated);
  y_max := ST_YMax(rotated);

  -- The cut lies at the share of the long axis: for the usual rectangular parking that is the share of the area.
  cut := x_min + share * (x_max - x_min);

  RETURN ARRAY[
    ST_Multi(ST_Transform(ST_Rotate(
      ST_CollectionExtract(ST_ClipByBox2D(
        rotated,
        ST_MakeEnvelope(x_min - margin, y_min - margin, cut, y_max + margin, 5243)
      ), 3),
      axis_angle, centre
    ), 3857)),
    ST_Multi(ST_Transform(ST_Rotate(
      ST_CollectionExtract(ST_ClipByBox2D(
        rotated,
        ST_MakeEnvelope(cut, y_min - margin, x_max + margin, y_max + margin, 5243)
      ), 3),
      axis_angle, centre
    ), 3857))
  ];
END;
$$;
