/* sql-formatter-disable */
--
-- Entry point for all SQL based processing.
--
-- NOTE: We intentionally no longer move bikelane geometries sideways off the road
-- centerline. The derived bikelane geometry now stays on the centerline and the
-- sideways offset is applied purely visually in the map style via `line-offset`,
-- derived from the `offset` attribute (meters, signed by side). See the topic-doc
-- chapter `versetzte-geometrien` and processing/CHANGELOG.md for details.
\i '/processing/topics/roads_bikelanes/3_cleanup_todos_lines.sql'

DO $$ BEGIN RAISE NOTICE 'FINISH topics/roads_bikelanes/roads_bikelanes.sql at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
