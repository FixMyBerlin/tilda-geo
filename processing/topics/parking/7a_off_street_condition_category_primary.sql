-- WHAT IT DOES:
-- Add rendering-only `condition_category_primary` on Lua-written off-street tables.
-- Same function as `7_finalize_parkings.sql`. Must run before `8_create_quantized_tables.sql`
-- so quantized points inherit the tag.
-- INPUT/OUTPUT: `off_street_parking_areas`, `off_street_parking_points`
--
DO $$ BEGIN RAISE NOTICE 'START off-street condition_category_primary at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

UPDATE off_street_parking_areas
SET
  tags = tags || jsonb_build_object(
    'condition_category_primary',
    tilda_condition_category_primary (tags ->> 'condition_category')
  );

UPDATE off_street_parking_points
SET
  tags = tags || jsonb_build_object(
    'condition_category_primary',
    tilda_condition_category_primary (tags ->> 'condition_category')
  );

DO $$ BEGIN RAISE NOTICE 'END off-street condition_category_primary at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
