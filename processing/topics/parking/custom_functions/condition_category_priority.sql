-- WHAT IT DOES:
-- Priority order of `condition_category` bases, used ONLY as the tie-break when picking the
-- painted category of an edge side (`11_create_edges.sql`, equal capacity).
-- The per-object `condition_category_primary` tag is computed in Lua
-- (`helper/condition_category_primary.lua`).
--
-- KEEP IN SYNC with the ARRAY in `helper/condition_category_primary.lua`.
-- USED IN: `11_create_edges.sql`
DROP FUNCTION IF EXISTS tilda_condition_category_primary (text);

DROP FUNCTION IF EXISTS tilda_condition_category_priority ();

CREATE OR REPLACE FUNCTION tilda_condition_category_priority () RETURNS TABLE (category text, pri integer) LANGUAGE sql IMMUTABLE AS $$
  SELECT
    *
  FROM
    unnest(
      ARRAY[
        'no_stopping',
        'bus_lane',
        'no_parking',
        'disabled_private',
        'disabled',
        'loading',
        'charging',
        'taxi',
        'car_sharing',
        'private',
        'assumed_private',
        'vehicle_restriction',
        'access_restriction',
        'maxweight',
        'mixed',
        'residents',
        'paid',
        'time_limited',
        'unspecified',
        'free',
        'assumed_free',
        'invalid'
      ]::text[]
    )
    WITH ORDINALITY AS t (category, pri);
$$;
