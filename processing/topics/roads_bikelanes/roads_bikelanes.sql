/* sql-formatter-disable */
--
-- Entry point for all SQL based processing.
--
-- NOTE: Derived bikelane geometries stay on the road centerline. The sideways
-- offset is applied visually in the map style via `line-offset`, from the
-- `offset` attribute (meters, `+` left / `-` right of the line's own direction).
-- Lines point in the riding direction; two-way lines run against the OSM way on
-- the left and with it on the right. Direction is decided in Lua
-- (`bikelanes/helper/side_line_reversed.lua`).
-- See topic-doc chapter `versetzte-geometrien` and processing/CHANGELOG.md.
\i '/processing/topics/roads_bikelanes/3_cleanup_todos_lines.sql'
\i '/processing/topics/roads_bikelanes/4_hide_network_noise.sql'
\i '/processing/topics/roads_bikelanes/5_qa_bikelanes.sql'
\i '/processing/topics/roads_bikelanes/6_route_relations.sql'

DO $$ BEGIN RAISE NOTICE 'FINISH topics/roads_bikelanes/roads_bikelanes.sql at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
