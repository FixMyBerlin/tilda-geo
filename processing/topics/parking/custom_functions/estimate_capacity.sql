DROP TABLE IF EXISTS _parking_orientation_constants;

CREATE TABLE _parking_orientation_constants (
  orientation TEXT PRIMARY KEY,
  car_space_x NUMERIC NOT NULL,
  car_space_y NUMERIC NOT NULL,
  padding NUMERIC NOT NULL
);

-- REMINDER: Changes here need to be reflected in: `processing/topics/parking/separate_parkings/helper/class_separate_parking_category.lua`
INSERT INTO
  _parking_orientation_constants (orientation, car_space_x, car_space_y, padding)
VALUES
  ('parallel', 4.4, 2.0, 0.8),
  ('perpendicular', 2.0, 4.4, 0.5),
  (
    'diagonal',
    SIN(RADIANS(60)) * 4.4 + COS(RADIANS(60)) * 2.0,
    COS(RADIANS(60)) * 4.4 + SIN(RADIANS(60)) * 2.0,
    COS(RADIANS(60)) * 0.5
  );

DROP FUNCTION IF EXISTS estimate_capacity;

CREATE FUNCTION estimate_capacity (length NUMERIC, orientation TEXT) RETURNS NUMERIC AS $$
DECLARE
  const RECORD;
  n_cars NUMERIC;
BEGIN
  -- Fetch constants for the given orientation
  SELECT
    car_space_x,
    car_space_y,
    padding
  INTO const
  FROM
    _parking_orientation_constants
  WHERE
    _parking_orientation_constants.orientation = COALESCE(estimate_capacity.orientation, 'parallel');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid orientation: "%", must be one of the defined types in parking_orientation_constants', orientation;
  END IF;

  -- The total length need to account for: n * car_length + (n - 1) * padding
  -- We solve for n:
  n_cars := (length + const.padding) / (const.car_space_x + const.padding);

  RETURN n_cars;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS estimate_area;

CREATE FUNCTION estimate_area (length NUMERIC, orientation TEXT) RETURNS NUMERIC AS $$
DECLARE
  const RECORD;
  area NUMERIC;
BEGIN
  -- Fetch constants for the given orientation
  SELECT
    car_space_y
  INTO const
  FROM
    _parking_orientation_constants
  WHERE
    _parking_orientation_constants.orientation = COALESCE(estimate_area.orientation, 'parallel');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid orientation: "%", must be one of the defined types in parking_orientation_constants', orientation;
  END IF;

  area := length * (const.car_space_y + 0.25);

  RETURN area;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
