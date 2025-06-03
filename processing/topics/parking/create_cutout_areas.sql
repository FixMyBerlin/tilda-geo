DROP TABLE IF EXISTS _parking_cutout_areas;

-- INSERT "intersection_corner" buffers (circle)
-- @var: "5" is the buffer in meter where no parking is allowed legally
SELECT
  id::TEXT,
  intersection_id as osm_id,
  ST_Buffer (geom, 5) as geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', 'intersection_corner',
    'source', 'intersections',
    'radius', 5
    /* sql-formatter-enable */
  ) AS tags,
  '{}'::jsonb AS meta,
  0 AS minzoom
  --
  INTO _parking_cutout_areas
FROM
  _parking_intersection_corners
WHERE
  NOT has_driveway
  AND has_road;

-- INSERT "driveway" buffers (rectangles)
INSERT INTO
  _parking_cutout_areas (id, osm_id, geom, tags, meta, minzoom)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (
    geom,
    ((tags ->> 'width')::float / 2)::float,
    'endcap=flat'
  ) as geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', 'driveway',
    'source', 'driveways',
    'width', tags ->> 'width',
    -- 'highway', tags ->> 'highway',
    'road', tags ->> 'road'
    /* sql-formatter-enable */
  ) AS tags,
  jsonb_build_object('updated_at', meta ->> 'updated_at') AS meta,
  0 AS minzoom
FROM
  _parking_driveways;

-- INSERT "crossing" buffers (rectangles)
INSERT INTO
  _parking_cutout_areas (id, osm_id, geom, tags, meta, minzoom)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (
    geom,
    (tags ->> 'perform_buffer')::float,
    'endcap=flat'
  ) as geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'crossing',
    'width', (tags ->> 'perform_buffer')::float
    /* sql-formatter-enable */
  ) AS tags,
  jsonb_build_object('updated_at', meta ->> 'updated_at') AS meta,
  0 AS minzoom
FROM
  _parking_crossings;

-- INSERT "obstacle" buffers (circle)
INSERT INTO
  _parking_cutout_areas (id, osm_id, geom, tags, meta, minzoom)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, (tags ->> 'perform_buffer')::float) as geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacles',
    'radius', (tags ->> 'perform_buffer')::float
    /* sql-formatter-enable */
  ) AS tags,
  jsonb_build_object('updated_at', meta ->> 'updated_at') AS meta,
  0 AS minzoom
FROM
  _parking_obstacle_points_projected;

-- MISC
ALTER TABLE _parking_cutout_areas
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_cutout_areas_geom_idx ON _parking_intersections USING GIST (geom);

DO $$
BEGIN
  RAISE NOTICE 'Finished creating cutout areas at %', clock_timestamp();
END
$$;
