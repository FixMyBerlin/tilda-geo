/* sql-formatter-disable */
--
-- Entry point for all SQL based processing of parking data.
--
-- Guidelines:
-- - Put all decisions (that are feasable) into LUA and pass them to SQL via tags.
-- - Use "command tags" like "buffer_radius".
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
\i '/processing/topics/parking/custom_functions/line_azimuth_at_index.sql'
\i '/processing/topics/parking/custom_functions/trim_kerb_at_corner.sql'
-- * … FOR INTERSECTIONS
\i '/processing/topics/parking/custom_functions/intersection_angle.sql'
\i '/processing/topics/parking/custom_functions/get_intersection_corners.sql'
\i '/processing/topics/parking/custom_functions/segmentize_way_to_edges.sql'
\i '/processing/topics/parking/custom_functions/estimate_capacity.sql'
\i '/processing/topics/parking/custom_functions/explode_parkings.sql'
\i '/processing/topics/parking/custom_functions/round_capacity.sql'
\i '/processing/topics/parking/custom_functions/osm_ref.sql'

-- * … FOR SEPARATE PARKINGS
\i '/processing/topics/parking/custom_functions/get_polygon_corners.sql'
\i '/processing/topics/parking/custom_functions/get_parking_edges.sql'

-- HANDLE ROADS
\i '/processing/topics/parking/roads/0_create_kerbs.sql'
\i '/processing/topics/parking/roads/1_find_intersections.sql'
\i '/processing/topics/parking/roads/2_find_intersection_corners.sql'
\i '/processing/topics/parking/roads/3_find_driveways.sql'
\i '/processing/topics/parking/roads/4_build_graph.sql'
\i '/processing/topics/parking/roads/5_trim_kerbs.sql'
\i '/processing/topics/parking/roads/6_driveway_corners_kerbs.sql'


-- HANDLE CROSSING (and similar structures)
\i '/processing/topics/parking/crossings/1_points_locate_on_road.sql'
\i '/processing/topics/parking/crossings/2_points_create_crossings.sql'
\i '/processing/topics/parking/crossings/1_lines_project_crossings.sql'

-- HANDLE OBSTACLES
\i '/processing/topics/parking/obstacles/0_areas_project_to_kerb.sql'
\i '/processing/topics/parking/obstacles/0_lines_project_to_kerb.sql'
\i '/processing/topics/parking/obstacles/0_points_project_to_kerb.sql'

-- HANDLE SEPARATE PARKINGS
\i '/processing/topics/parking/separate_parkings/0_areas_project_to_kerb.sql'
\i '/processing/topics/parking/separate_parkings/0_points_project_to_kerb.sql'
\i '/processing/topics/parking/separate_parkings/1_separate_parking_areas_qa.sql'


-- HANDLE PARKINGS
\i '/processing/topics/parking/parkings/0_add_kerb_geoms.sql'

-- CREATE CUTOUT AREAS
\i '/processing/topics/parking/0_create_cutouts.sql'
\i '/processing/topics/parking/1_cutout_road_parkings.sql'
\i '/processing/topics/parking/2_cutout_separate_parkings.sql'
\i '/processing/topics/parking/3_redistribute_parking_capacities.sql'
\i '/processing/topics/parking/4_merge_parkings.sql'
\i '/processing/topics/parking/5_estimate_parking_capacities.sql'
\i '/processing/topics/parking/6_filter_parkings.sql'
\i '/processing/topics/parking/7_finalize_parkings.sql'
-- \i '/processing/topics/parking/8_qa_parkings_euvm_voronoi.sql'
\i '/processing/topics/parking/9_create_labels.sql'



DO $$ BEGIN RAISE NOTICE 'FINISH topics/parking/parking.sql at %', clock_timestamp(); END $$;
