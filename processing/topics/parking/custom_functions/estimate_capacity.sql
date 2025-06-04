CREATE OR REPLACE FUNCTION estimate_capacity (length NUMERIC, orientation TEXT) RETURNS INTEGER AS $$
DECLARE
  car_length NUMERIC;
  padding NUMERIC;
  n_cars INTEGER;
BEGIN
  IF orientation = 'parallel' THEN
    car_length := 6.0;
    padding := 0.5;
  ELSIF orientation = 'diagonal' THEN
    car_length := 4.5;
    padding := 0.2;
  ELSIF orientation = 'perpendicular' THEN
    car_length := 3;
    padding := 0.3;
  ELSE
    -- same as parallel
    car_length := 6.0;
    padding := 0.5;
  END IF;

  -- The total length need to account for: n * car_length + (n - 1) * padding
  -- We solve for n:
  n_cars := FLOOR((length + padding) / (car_length + padding));

  RETURN n_cars;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
