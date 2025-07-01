/* sql-formatter-disable */
--
-- Entry point for all SQL based processing of parking data.
--
-- Guidelines:
-- - Put all decisions (that are feasable) into LUA and pass them to SQL via tags.
-- - Use "command tags" like "perform_buffer".
-- - Extract complex SQL into functions.
-- - Split code into files and document them.
-- - Indexes are handled by the SQL files.
-- - TODO: Add tests for those files.
--

-- CREATE CUSTOM FUNCTIONS
-- * … TO PROJECT
\i '/processing/topics/parking/custom_functions/project_to_k_closest_kerbs.sql'
\i '/processing/topics/parking/custom_functions/project_to_line.sql'
-- * … FOR KERBS
\i '/processing/topics/parking/custom_functions/kerb_tangent.sql'
\i '/processing/topics/parking/custom_functions/line_azimuth_at_index.sql'
\i '/processing/topics/parking/custom_functions/trim_kerb_at_corner.sql'
-- * … FOR INTERSECTIONS
\i '/processing/topics/parking/custom_functions/intersection_angle.sql'
\i '/processing/topics/parking/custom_functions/get_intersection_corners.sql'
\i '/processing/topics/parking/custom_functions/segmentize_way_to_edges.sql'
\i '/processing/topics/parking/custom_functions/estimate_capacity.sql'
\i '/processing/topics/parking/custom_functions/get_polygon_corners.sql'
\i '/processing/topics/parking/custom_functions/get_pair_normal.sql'

-- HANDLE ROADS
\i '/processing/topics/parking/roads/0_create_kerbs.sql'
\i '/processing/topics/parking/roads/1_find_intersections.sql'
\i '/processing/topics/parking/roads/2_find_intersection_corners.sql'
\i '/processing/topics/parking/roads/3_find_driveways.sql'
\i '/processing/topics/parking/roads/4_build_graph.sql'
\i '/processing/topics/parking/roads/5_trim_kerbs.sql'

-- HANDLE CROSSING (and similar structures)
\i '/processing/topics/parking/crossings/1_points_locate_on_road.sql'
\i '/processing/topics/parking/crossings/2_points_create_kerb_tangents.sql'
\i '/processing/topics/parking/crossings/3_points_create_crossings.sql'

-- HANDLE OBSTACLES
\i '/processing/topics/parking/obstacles/0_areas_project_to_kerb.sql'
\i '/processing/topics/parking/obstacles/0_lines_project_to_kerb.sql'
\i '/processing/topics/parking/obstacles/0_points_project_to_kerb.sql'

-- HANDLE SEPARATE PARKINGS
\i '/processing/topics/parking/separate_parkings/0_areas_project_to_kerb.sql'
\i '/processing/topics/parking/separate_parkings/0_points_project_to_kerb.sql'
-- TEMP disabled, see https://github.com/FixMyBerlin/private-issues/issues/2524#issuecomment-2958746495
-- \i '/processing/topics/parking/separate_parkings/1_parking_corners.sql'
-- \i '/processing/topics/parking/separate_parkings/1_parking_normals.sql'

-- HANDLE PARKINGS
\i '/processing/topics/parking/parkings/0_add_kerb_geoms.sql'

-- CREATE CUTOUT AREAS
\i '/processing/topics/parking/0_create_cutouts.sql'
\i '/processing/topics/parking/1_cutout_road_parkings.sql'
\i '/processing/topics/parking/2_cutout_separate_parkings.sql'
\i '/processing/topics/parking/3_merge_parkings.sql'
\i '/processing/topics/parking/4_estimate_parking_capacity.sql'
\i '/processing/topics/parking/5_finalize_parkings.sql'


DO $$ BEGIN RAISE NOTICE 'FINISH topics/parking/parking.sql at %', clock_timestamp(); END $$;
