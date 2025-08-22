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
  -- diagonal parking is a bit more complex.
  -- We calulate the required space by rotating the perpendicular parking by 30 degrees.
  -- Additionally, we scale car_space_x by 2/3 to account for the overlap of the cars.
  (
    'diagonal',
    (COS(RADIANS(30)) * 2.0 + SIN(RADIANS(30)) * 4.4) * 0.66,
    COS(RADIANS(30)) * 4.4 + SIN(RADIANS(30)) * 2.0,
    COS(RADIANS(30)) * 0.5
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

DROP FUNCTION IF EXISTS estimate_capacity_from_area;

CREATE FUNCTION estimate_capacity_from_area (area NUMERIC, orientation TEXT) RETURNS NUMERIC AS $$
DECLARE
  const RECORD;
  capacity NUMERIC;
  car_area NUMERIC;
  padding_area NUMERIC;
  effective_orientation TEXT;
BEGIN
  effective_orientation := COALESCE(orientation, 'parallel');
  IF orientation = 'diagonal' THEN
    effective_orientation := 'perpendicular';
  END IF;

  -- Fetch constants for the given orientation
  SELECT
    padding,
    car_space_x,
    car_space_y
  INTO const
  FROM
    _parking_orientation_constants
  WHERE
    _parking_orientation_constants.orientation = effective_orientation;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid orientation: "%", must be one of the defined types in parking_orientation_constants', orientation;
  END IF;

  car_area := const.car_space_x * const.car_space_y;
  padding_area := const.padding * const.car_space_y;

  capacity := (area + padding_area) / (car_area + padding_area);

  RETURN capacity;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
