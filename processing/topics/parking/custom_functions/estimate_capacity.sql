-- WHAT IT DOES:
-- Define orientation constants and provide functions to estimate parking capacity from length/area.
-- * Creates `_parking_orientation_constants` table with car_space_x, car_space_y, padding for parallel/perpendicular/diagonal
-- * Provides three estimation functions: capacity from length, area from length, capacity from area
DROP TABLE IF EXISTS _parking_orientation_constants;

-- Define constants for parking orientations:
-- NOTE: The TEMP table is defined for the session of `parking.sql` and used in at least one external function (separate_parkings/0_points_project_to_kerb.sql)
CREATE TABLE _parking_orientation_constants (
  orientation TEXT PRIMARY KEY,
  car_space_x NUMERIC NOT NULL,
  car_space_y NUMERIC NOT NULL,
  padding NUMERIC NOT NULL
);

INSERT INTO
  _parking_orientation_constants (
    orientation,
    car_space_x, -- "length" per car as seen from the kerb (meters)
    car_space_y, -- "depth/width" per car perpendicular to kerb (meters)
    padding -- space between cars (meters)
  )
VALUES
  -- REMINDER: Changes here need to be reflected in:
  -- `processing/topics/parking/separate_parkings/helper/class_separate_parking_category.lua`
  (
    -- orientation:
    'parallel',
    -- car_space_x:
    4.4,
    -- car_space_y:
    2.0,
    -- padding:
    0.8
  ),
  (
    -- orientation:
    'perpendicular',
    -- car_space_x:
    2.0,
    -- car_space_y:
    4.4,
    -- padding:
    0.5
  ),
  (
    -- orientation:
    'diagonal',
    -- car_space_x: rotated perpendicular parking by 30 degrees, scaled by 2/3 to account for car overlap
    (COS(RADIANS(30)) * 2.0 + SIN(RADIANS(30)) * 4.4) * 0.66,
    -- car_space_y: rotated perpendicular parking by 30 degrees
    COS(RADIANS(30)) * 4.4 + SIN(RADIANS(30)) * 2.0,
    -- padding: rotated perpendicular parking by 30 degrees
    COS(RADIANS(30)) * 0.5
  );

DROP FUNCTION IF EXISTS tilda_estimate_capacity;

-- WHAT IT DOES:
-- Estimate number of parking spaces from linestring length and orientation.
-- * Formula: (length + padding) / (car_space_x + padding)
-- USED IN: `separate_parkings/0_areas_project_to_kerb.sql`, `5_estimate_parking_capacities.sql`
CREATE FUNCTION tilda_estimate_capacity (length NUMERIC, orientation TEXT) RETURNS NUMERIC AS $$
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
    _parking_orientation_constants.orientation = COALESCE(tilda_estimate_capacity.orientation, 'parallel');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid orientation: "%", must be one of the defined types in parking_orientation_constants', orientation;
  END IF;

  -- The total length need to account for: n * car_length + (n - 1) * padding
  -- We solve for n:
  n_cars := (length + const.padding) / (const.car_space_x + const.padding);

  RETURN n_cars;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS tilda_estimate_area;

-- WHAT IT DOES:
-- Estimate parking area from linestring length and orientation.
-- * Formula: length * (car_space_y + 0.25)
-- * Uses car_space_y (perpendicular dimension) to calculate rectangular area
-- USED IN: `separate_parkings/1_separate_parking_areas_qa.sql`, `5_estimate_parking_capacities.sql`
CREATE FUNCTION tilda_estimate_area (length NUMERIC, orientation TEXT) RETURNS NUMERIC AS $$
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
    _parking_orientation_constants.orientation = COALESCE(tilda_estimate_area.orientation, 'parallel');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid orientation: "%", must be one of the defined types in parking_orientation_constants', orientation;
  END IF;

  area := length * (const.car_space_y + 0.25);

  RETURN area;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS tilda_estimate_capacity_from_area;

-- WHAT IT DOES:
-- Estimate number of parking spaces from polygon area and orientation.
-- * Calculates car_area = car_space_x * car_space_y, padding_area = padding * car_space_y
-- * Formula: (area + padding_area) / (car_area + padding_area)
-- * Special handling: diagonal orientation uses perpendicular constants
-- USED IN: `5_estimate_parking_capacities.sql` <-- CURRENTLY COMMENTED OUT
CREATE FUNCTION tilda_estimate_capacity_from_area (area NUMERIC, orientation TEXT) RETURNS NUMERIC AS $$
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
