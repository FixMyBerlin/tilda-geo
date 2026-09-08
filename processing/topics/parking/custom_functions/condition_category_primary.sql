-- WHAT IT DOES:
-- Rendering-only: pick the primary `condition_category` for styling, and expose that
-- same priority order for edge-side aggregation.
--
-- KEEP IN SYNC with the token order in
-- `park_street_default.ts` and `park_off_default_area.ts`
-- (generated from Mapbox Studio via `scripts/MapboxStyles/process.ts`).
-- After changing that cascade (or this ARRAY), update the other side.
-- Edge colours: `parkingTildaEdgesLayers.const.ts` (`conditionCategoryPrimaryLineColor`).
--
-- Lua `classify_parking_conditions` can emit extra bases (e.g. `no_standing`); those are
-- not in this list and fall through to `'default'`.
-- First ARRAY match wins; NULL/empty/no match → 'default'.
-- USED IN: `7_finalize_parkings.sql`, `7a_off_street_condition_category_primary.sql`, `11_create_edges.sql`
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
        'assumed_free'
      ]::text[]
    )
    WITH ORDINALITY AS t (category, pri);
$$;

CREATE OR REPLACE FUNCTION tilda_condition_category_primary (condition_category text) RETURNS text AS $$
DECLARE
  tokens text[];
  picked text;
BEGIN
  IF condition_category IS NULL OR btrim(condition_category) = '' THEN
    RETURN 'default';
  END IF;

  SELECT
    array_agg(btrim(split_part(btrim(t), ' (', 1)))
  INTO
    tokens
  FROM
    unnest(string_to_array(condition_category, ';')) AS t
  WHERE
    btrim(t) <> '';

  IF tokens IS NULL THEN
    RETURN 'default';
  END IF;

  SELECT
    p.category
  INTO
    picked
  FROM
    tilda_condition_category_priority () p
  WHERE
    p.category = ANY (tokens)
  ORDER BY
    p.pri
  LIMIT
    1;

  RETURN COALESCE(picked, 'default');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
