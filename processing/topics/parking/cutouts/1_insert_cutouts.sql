-- WHAT IT DOES:
-- Insert cutout areas from various sources into `_parking_cutouts` table.
-- * Intersection corners (5m buffer) - conditionally
-- * Driveway corner kerbs, driveways, crossings (buffered)
-- * Obstacle points/lines/areas (buffered)
-- * Public transport stops, turnaround points (buffered)
-- * Separate parking areas/points (buffered)
-- * Roads (buffered) - cleanup leftover parking pieces on roads
-- INPUT: `_parking_intersection_corners`, `_parking_driveway_corner_kerbs`, `_parking_driveways`, `_parking_crossings`, `_parking_obstacle_points_projected`, `_parking_obstacle_areas_projected`, `_parking_obstacle_lines_projected`, `_parking_public_transport_points_projected`, `_parking_turnaround_points`, `_parking_separate_parking_areas_projected`, `_parking_separate_parking_points_projected`, `_parking_roads`
-- OUTPUT: `_parking_cutouts` (polygon) - areas where parking is not allowed
--
DO $$ BEGIN RAISE NOTICE 'START inserting cutout areas at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- INSERT "intersection_corner" buffers (circle)
-- Conditions: only where NOT `has_driveway` AND `has_road`.
-- Buffer: static value 5m (legal requirement where no parking is allowed)
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  id::TEXT,
  intersection_id AS osm_id,
  ST_Buffer (geom, 5) AS geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', 'intersection_corner',
    'source', 'intersections',
    'radius', 5
    /* sql-formatter-enable */
  ) AS tags,
  '{}'::jsonb AS meta,
  NULL AS street_name,
  'intersection_corner' AS category,
  NULL AS side
FROM
  _parking_intersection_corners
WHERE
  NOT has_driveway
  AND has_road;

-- INSERT "driveway_corner_kerb" buffers (rectangles)
-- Buffer: static value 0.01m
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  id::TEXT,
  kerb_osm_id,
  ST_Buffer (geom, 0.01, 'endcap=flat'),
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', 'driveway_corner_kerb',
    'source', 'driveway_corner_kerbs'
    /* sql-formatter-enable */
  ),
  '{}'::jsonb,
  NULL AS street_name,
  'driveway_corner_kerb' AS category,
  NULL AS side
FROM
  _parking_driveway_corner_kerbs;

-- INSERT "driveway" buffers (rectangles)
-- Buffer: tags->>'width' / 2
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (
    geom,
    ((tags ->> 'width')::float / 2)::float,
    'endcap=flat'
  ),
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', 'driveway',
    'source', 'driveways',
    'width', tags ->> 'width',
    -- 'highway', tags ->> 'highway',
    'road', tags ->> 'road'
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at'),
  tags ->> 'street:name' AS street_name,
  'driveway' AS category,
  NULL AS side
FROM
  _parking_driveways;

-- INSERT "crossing" buffers (rectangles)
-- Buffer: tags->>'buffer_radius'
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (
    geom,
    (tags ->> 'buffer_radius')::float,
    'endcap=flat'
  ),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'crossing',
    'width', (tags ->> 'buffer_radius')::float
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at'),
  tags ->> 'street:name' AS street_name,
  tags ->> 'category' AS category,
  NULL AS side
FROM
  _parking_crossings;

-- INSERT "obstacle_point" buffers (circle)
-- Buffer: tags->>'buffer_radius'
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, (tags ->> 'buffer_radius')::float),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_points',
    'radius', (tags ->> 'buffer_radius')::float,
    'side', kerb_side
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at'),
  tags ->> 'street:name' AS street_name,
  tags ->> 'category' AS category,
  kerb_side AS side
FROM
  _parking_obstacle_points_projected;

-- INSERT "public_transport_stops" buffers (circle) - both v2 and v3
-- Buffer: tags->>'buffer_radius'
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, (tags ->> 'buffer_radius')::float),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'public_transport_stops',
    'radius', (tags ->> 'buffer_radius')::float,
    'side', COALESCE(source ->> 'kerb_side', 'platform')
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at'),
  tags ->> 'street:name' AS street_name,
  tags ->> 'category' AS category,
  COALESCE(source ->> 'kerb_side', 'platform') AS side
FROM
  _parking_public_transport_points_projected;

-- INSERT "turnaround_point" buffers (circle) - unprojected obstacles
-- Buffer: tags->>'buffer_radius'
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, (tags ->> 'buffer_radius')::float),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category', -- see processing/topics/parking/obstacles_unprojected/point/obstacle_point_categories.lua
    'source', 'turnaround_points',
    'radius', (tags ->> 'buffer_radius')::float
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at'),
  tags ->> 'street:name' AS street_name,
  tags ->> 'category' AS category,
  NULL AS side
FROM
  _parking_turnaround_points;

-- INSERT "obstacle_area" buffers (buffered lines)
-- Buffer: static value 0.6m
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.6, 'endcap=flat'),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_areas',
    'side', kerb_side
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at'),
  tags ->> 'street:name' AS street_name,
  tags ->> 'category' AS category,
  kerb_side AS side
FROM
  _parking_obstacle_areas_projected;

-- INSERT "obstacle_line" buffers (buffered lines)
-- Buffer: static value 0.6m
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.6, 'endcap=flat'),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_lines',
    'side', kerb_side
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at'),
  tags ->> 'street:name' AS street_name,
  tags ->> 'category' AS category,
  kerb_side AS side
FROM
  _parking_obstacle_lines_projected;

-- INSERT "parking area" buffers (buffered lines)
-- Buffer: COALESCE(tags->>'road_width' * 0.7, 3)
-- Just enough to not overlap with the other side of the road
-- But needs to be big enough to intersect road parking lines, so they get cut out and replaced by separate parking
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (
    geom,
    COALESCE((tags ->> 'road_width')::NUMERIC * 0.7, 3),
    'endcap=flat'
  ),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'separate_parking_areas'
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at'),
  tags ->> 'street:name' AS street_name,
  tags ->> 'category' AS category,
  NULL AS side
FROM
  _parking_separate_parking_areas_projected;

-- INSERT "parking point" buffers (buffered lines)
-- Buffer: static value 0.6m
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.6, 'endcap=flat'),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'separate_parking_points'
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at'),
  tags ->> 'street:name' AS street_name,
  tags ->> 'category' AS category,
  NULL AS side
FROM
  _parking_separate_parking_points_projected;

-- INSERT roads
-- Cleanup: removes leftover parking pieces on roads
-- Uses LEAST(offset_right, offset_left) * 0.9 for buffer, excludes driveways without parking
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (
    geom,
    LEAST(
      (tags ->> 'offset_right')::NUMERIC,
      (tags ->> 'offset_left')::NUMERIC
    ) * 0.9,
    'endcap=flat'
  ),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'parking_roads'
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at'),
  tags ->> 'street:name' AS street_name,
  tags ->> 'category' AS category,
  NULL AS side
FROM
  _parking_roads
WHERE
  NOT (
    is_driveway = true
    AND has_parking = false
  );
