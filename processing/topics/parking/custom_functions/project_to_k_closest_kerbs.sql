-- this function projects a given geometry to the k closest kerbs
-- the parameter tolerance define the maximum distance to the closest kerb
CREATE OR REPLACE FUNCTION project_to_k_closest_kerbs (
  input_geom geometry,
  tolerance double precision,
  k integer
) RETURNS geometry AS $$
DECLARE
  kerb geometry;
  projected geometry;
  result geometry := NULL;
BEGIN
  -- get the k closest kerbs w.r.t the input_geom
  FOR kerb IN
    SELECT geom
    FROM _parking_kerbs_merged
    WHERE has_parking AND ST_DWithin(input_geom, geom, tolerance)
    ORDER BY ST_Distance(input_geom, geom)
    LIMIT k
  LOOP
    -- project the input_geom to the kerb and collect the results
    projected := project_to_line(input_geom, kerb);
    result := ST_Collect(result, projected);
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;
