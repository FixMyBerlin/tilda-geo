/* sql-formatter-disable */
--
-- Entry point for all SQL based processing.
--
-- NOTE: Derived bikelane geometries stay on the road centerline. The sideways
-- offset is applied visually in the map style via `line-offset`, from the
-- `offset` attribute (meters, `+` left / `-` right). Left-side lines run
-- against the OSM way; right-side lines run with it.
-- See topic-doc chapter `versetzte-geometrien` and processing/CHANGELOG.md.
\i '/processing/topics/roads_bikelanes/2_orient_bikelanes.sql'
\i '/processing/topics/roads_bikelanes/2_orient_routing.sql'
\i '/processing/topics/roads_bikelanes/3_cleanup_todos_lines.sql'

DO $$ BEGIN RAISE NOTICE 'FINISH topics/roads_bikelanes/roads_bikelanes.sql at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
