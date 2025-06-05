CREATE OR REPLACE FUNCTION estimate_capacity (length NUMERIC, orientation TEXT) RETURNS INTEGER AS $$
DECLARE
  car_length NUMERIC := 4.4;
  car_width NUMERIC := 2;
  parking_angle NUMERIC := Radians(60); -- 0 degrees = perpendicular
  space_per_car NUMERIC;
  padding_parallel NUMERIC := 0.8;
  padding_prependicular NUMERIC := 0.5;
  padding NUMERIC;
  n_cars INTEGER;
BEGIN

  IF orientation = 'parallel' OR orientation IS NULL THEN
    space_per_car := car_length;
    padding := padding_parallel;
  ELSIF orientation = 'diagonal' THEN
    space_per_car :=  Sin(parking_angle) * car_length + Cos(parking_angle) * car_width;
    padding := Cos(parking_angle) * padding_prependicular;
  ELSIF orientation = 'perpendicular' THEN
    space_per_car := car_width;
    padding := padding_prependicular;
  ELSE
    RAISE EXCEPTION 'Invalid orientation: %, must be "parallel" or "diagonal"', orientation;
  END IF;

  -- The total length need to account for: n * car_length + (n - 1) * padding
  -- We solve for n:
  n_cars := ROUND((length + padding) / (car_length + padding));

  RETURN n_cars;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
