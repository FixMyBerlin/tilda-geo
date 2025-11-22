-- WHAT IT DOES:
-- Round parking capacity to integer with special handling for small values.
-- * For capacity < 10: floor with 0.1 offset (e.g., 4.9 -> 5, 4.8 -> 4)
-- * For capacity >= 10: standard round (e.g., 10.4 -> 10, 10.5 -> 11)
-- USED IN: `7_finalize_parkings.sql` (round capacity values before finalizing)
DROP FUNCTION IF EXISTS tilda_round_capacity;

CREATE OR REPLACE FUNCTION tilda_round_capacity (capacity NUMERIC) RETURNS INTEGER AS $$
BEGIN
  IF capacity < 10 THEN
    RETURN FLOOR(capacity + 0.1);
  ELSE
    RETURN ROUND(capacity);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
