CREATE OR REPLACE FUNCTION estimate_capacity (length NUMERIC, orientation TEXT) RETURNS INTEGER AS $$
DECLARE
  car_length NUMERIC := 5;
  car_width NUMERIC := 2.5;
  parking_angle NUMERIC := Radians(60); -- 0 degrees = parallel
  space_per_car NUMERIC;
  padding NUMERIC;
  n_cars INTEGER;
BEGIN

  IF orientation = 'parallel' OR orientation IS NULL THEN
    space_per_car := car_length;
  ELSIF orientation = 'diagonal' THEN
    space_per_car := Cos(parking_angle) * car_length + Sin(parking_angle) * car_width;
    -- TODO maybe also transfrom the padding to diagonal?
  ELSIF orientation = 'perpendicular' THEN
    space_per_car := car_width;
  ELSE
    RAISE EXCEPTION 'Invalid orientation: %, must be "parallel" or "diagonal"', orientation;
  END IF;

  -- The total length need to account for: n * car_length + (n - 1) * padding
  -- We solve for n:
  n_cars := ROUND((length + padding) / (car_length + padding));

  RETURN n_cars;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
