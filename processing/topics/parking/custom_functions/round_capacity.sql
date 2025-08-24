DROP FUNCTION IF EXISTS round_capacity;

CREATE OR REPLACE FUNCTION round_capacity (capacity NUMERIC) RETURNS INTEGER AS $$
BEGIN
  IF capacity < 10 THEN
    RETURN FLOOR(capacity + 0.1);
  ELSE
    RETURN ROUND(capacity);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
