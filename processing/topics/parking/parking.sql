/* sql-formatter-disable */
--
-- Entry point for all SQL based processing of parking data.
--
-- Guidelines:
-- - Put all decisions (that are feasable) into LUA and pass them to SQL via tags.
-- - Use "command tags" like "perform_snap".
-- - Extract complex SQL into functions.
-- - Split code into files and document them.
-- - Indexes are handled by the SQL files.
-- - TODO: Add tests for those files.
--

-- CREATE CUSTOM FUNCTIONS
-- * PROJECT
\i '/processing/topics/parking/custom_functions/project_to_k_closest_kerbs.sql'
\i '/processing/topics/parking/custom_functions/project_to_line.sql'
-- * KERBS
\i '/processing/topics/parking/custom_functions/kerb_tangent.sql'
\i '/processing/topics/parking/custom_functions/line_azimuth_at_index.sql'
\i '/processing/topics/parking/custom_functions/cut_kerb_at_corner.sql'

-- * INTERSECTIONS
\i '/processing/topics/parking/custom_functions/intersection_angle.sql'
\i '/processing/topics/parking/custom_functions/get_intersection_corners.sql'
\i '/processing/topics/parking/custom_functions/segmentize_way_to_edges.sql'

-- HANDLE ROADS
\i '/processing/topics/parking/roads/0_create_kerbs.sql'
\i '/processing/topics/parking/roads/1_merge_kerbs.sql'
\i '/processing/topics/parking/roads/4_find_intersections.sql'
\i '/processing/topics/parking/roads/5_find_intersection_corners.sql'
\i '/processing/topics/parking/roads/6_find_driveways.sql'
\i '/processing/topics/parking/roads/7_build_graph.sql'
\i '/processing/topics/parking/roads/8_cut_kerbs.sql'


-- HANDLE OBSTACLES
\i '/processing/topics/parking/obstacles/0_areas_project_to_kerb.sql'
\i '/processing/topics/parking/obstacles/0_lines_project_to_kerb.sql'
\i '/processing/topics/parking/obstacles/0_points_project_to_kerb.sql'
\i '/processing/topics/parking/obstacles/1_points_locate_on_road.sql'
\i '/processing/topics/parking/obstacles/2_points_create_kerb_tangents.sql'
\i '/processing/topics/parking/obstacles/3_points_create_crossings.sql'

-- HANDLE PARKINGS
\i '/processing/topics/parking/parkings/0_add_kerb_geoms.sql'

-- CREATE PUNCHING AREAS
\i '/processing/topics/parking/punching_areas.sql'
