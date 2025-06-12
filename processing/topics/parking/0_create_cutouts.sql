DO $$ BEGIN RAISE NOTICE 'START creating cutout areas at %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _parking_cutouts;

DROP TABLE IF EXISTS _parking_discarded_cutouts;

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
  INTO _parking_cutouts
FROM
  _parking_intersection_corners
WHERE
  NOT has_driveway
  AND has_road;

-- INSERT "driveway" buffers (rectangles)
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta, minzoom)
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
  _parking_cutouts (id, osm_id, geom, tags, meta, minzoom)
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
  ) || tags AS tags,
  jsonb_build_object('updated_at', meta ->> 'updated_at') AS meta,
  0 AS minzoom
FROM
  _parking_crossings;

-- INSERT "obstacle_point" buffers (circle)
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta, minzoom)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, (tags ->> 'perform_buffer')::float) as geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_points',
    'radius', (tags ->> 'perform_buffer')::float
    /* sql-formatter-enable */
  ) || tags AS tags,
  jsonb_build_object('updated_at', meta ->> 'updated_at') AS meta,
  0 AS minzoom
FROM
  _parking_obstacle_points_projected;

-- INSERT "obstacle_area" buffers (buffered lines)
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta, minzoom)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.2) as geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_areas'
    /* sql-formatter-enable */
  ) || tags AS tags,
  jsonb_build_object('updated_at', meta ->> 'updated_at') AS meta,
  0 AS minzoom
FROM
  _parking_obstacle_areas_projected;

-- INSERT "obstacle_line" buffers (buffered lines)
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta, minzoom)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.2) as geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_lines'
    /* sql-formatter-enable */
  ) || tags AS tags,
  jsonb_build_object('updated_at', meta ->> 'updated_at') AS meta,
  0 AS minzoom
FROM
  _parking_obstacle_lines_projected;

-- INSERT "obstacle" buffers (buffered lines)
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta, minzoom)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.2) as geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'separate_parking_areas'
    /* sql-formatter-enable */
  ) || tags AS tags,
  jsonb_build_object('updated_at', meta ->> 'updated_at') AS meta,
  0 AS minzoom
FROM
  _parking_separate_parking_areas_projected;

CREATE INDEX parking_cutout_areas_geom_idx ON _parking_intersections USING GIST (geom);

-- get all ids for cutouts that need to be discarded
SELECT
  c.id INTO TEMP to_discard
FROM
  _parking_cutouts c
  JOIN _parking_parkings1_road p ON c.geom && p.geom
WHERE
  ST_Intersects (c.geom, p.geom)
  AND (
    c.tags ->> 'highway' = 'turning_circle'
    OR c.tags ->> 'highway' = 'bus_stop'
  )
  AND p.tags ->> 'parking' = 'no';

CREATE INDEX to_discard_idx ON to_discard USING BTREE (id);

SELECT
  * INTO _parking_discarded_cutouts
FROM
  _parking_cutouts
WHERE
  id IN (
    SELECT
      id
    FROM
      to_discard
  );

DELETE FROM _parking_cutouts
WHERE
  id IN (
    SELECT
      id
    FROM
      to_discard
  );

-- MISC
ALTER TABLE _parking_cutouts
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

ALTER TABLE _parking_discarded_cutouts
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
