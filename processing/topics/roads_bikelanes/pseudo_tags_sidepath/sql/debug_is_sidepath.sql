-- Debug tables for is_sidepath estimation. Martin-compatible (public schema, geom + tags).
-- All spatial ops use _sidepath_estimation_* views (geom in 3857), so buffer_distance/buffer_size are meters.
-- At the end we ST_Transform(geom, 4326) only for Martin display.
-- None of the debug inserts consume tilda_sidepath_checkpoint_nr_sequence.

DROP TABLE IF EXISTS public._debug_is_sidepath_checkpoints;
DROP TABLE IF EXISTS public._debug_is_sidepath_matches;
DROP TABLE IF EXISTS public._debug_is_sidepath_paths;
DROP TABLE IF EXISTS public._debug_is_sidepath_roads;

CREATE TABLE public._debug_is_sidepath_checkpoints (
  geom geometry,
  tags jsonb
);

CREATE TABLE public._debug_is_sidepath_matches (
  geom geometry,
  tags jsonb
);

CREATE TABLE public._debug_is_sidepath_paths (
  geom geometry,
  tags jsonb
);

CREATE TABLE public._debug_is_sidepath_roads (
  geom geometry,
  tags jsonb
);

-- Roads: the road set we check against (same source and filter as _sidepath_estimation_roads in run_is_sidepath_estimation.sql).
INSERT INTO public._debug_is_sidepath_roads (geom, tags)
SELECT
  r.geom,
  jsonb_build_object(
    'osm_id', r.osm_id,
    'highway', r.highway,
    'name', r.name,
    'layer', r.layer,
    'maxspeed', r.maxspeed
  )
FROM _sidepath_estimation_roads r;

WITH points_debug AS (
  SELECT
    p.osm_id,
    p.layer,
    pt.geom AS point_geom,
    row_number() OVER (PARTITION BY p.osm_id ORDER BY (SELECT 1)) AS checkpoint_nr
  FROM _sidepath_estimation_paths p,
       LATERAL tilda_sidepath_dict_interpolated_points(:buffer_distance, p.geom) AS pt(geom)
)
INSERT INTO public._debug_is_sidepath_checkpoints (geom, tags)
SELECT
  ST_Buffer(c.point_geom, :buffer_size),
  jsonb_build_object(
    'path_osm_id', c.osm_id,
    'checkpoint_nr', c.checkpoint_nr,
    'layer', c.layer
  )
FROM points_debug c;

WITH points_debug AS (
  SELECT
    p.osm_id,
    p.layer,
    pt.geom AS point_geom,
    row_number() OVER (PARTITION BY p.osm_id ORDER BY (SELECT 1)) AS checkpoint_nr
  FROM _sidepath_estimation_paths p,
       LATERAL tilda_sidepath_dict_interpolated_points(:buffer_distance, p.geom) AS pt(geom)
)
INSERT INTO public._debug_is_sidepath_matches (geom, tags)
SELECT
  r.geom,
  jsonb_build_object(
    'path_osm_id', c.osm_id,
    'checkpoint_nr', c.checkpoint_nr,
    'road_osm_id', r.osm_id,
    'road_highway', r.highway,
    'road_name', r.name,
    'road_layer', r.layer
  )
FROM points_debug c
JOIN _sidepath_estimation_roads r
  ON ST_DWithin(
       ST_Transform(c.point_geom, 3857),
       ST_Transform(r.geom, 3857),
       :buffer_size
     );

WITH points_debug AS (
  SELECT
    p.osm_id,
    pt.geom AS point_geom,
    row_number() OVER (PARTITION BY p.osm_id ORDER BY (SELECT 1)) AS nr,
    p.layer
  FROM _sidepath_estimation_paths p,
       LATERAL tilda_sidepath_dict_interpolated_points(:buffer_distance, p.geom) AS pt(geom)
),
joined AS (
  SELECT
    c.osm_id,
    c.nr,
    c.layer,
    r.osm_id AS road_id,
    r.highway AS road_highway,
    r.name AS road_name,
    r.layer AS road_layer,
    r.maxspeed AS road_maxspeed
  FROM points_debug c
  LEFT OUTER JOIN _sidepath_estimation_roads r
    ON ST_DWithin(
         ST_Transform(c.point_geom, 3857),
         ST_Transform(r.geom, 3857),
         :buffer_size
       )
),
agg AS (
  SELECT
    osm_id,
    tilda_sidepath_dict_agg(nr, layer, road_id, road_highway, road_name, road_layer, road_maxspeed) AS entry
  FROM joined
  GROUP BY osm_id
)
INSERT INTO public._debug_is_sidepath_paths (geom, tags)
SELECT
  p.geom,
  jsonb_build_object(
    'osm_id', agg.osm_id,
    'is_sidepath_estimation', tilda_sidepath_dict_is_sidepath(agg.entry)::text,
    'checks', (agg.entry->>'checks')::int,
    'entry', agg.entry
  )
FROM agg
JOIN _sidepath_estimation_paths p ON p.osm_id = agg.osm_id;

ALTER TABLE public._debug_is_sidepath_checkpoints
  ALTER COLUMN geom TYPE geometry(Geometry, 4326) USING ST_Transform(geom, 4326);
ALTER TABLE public._debug_is_sidepath_matches
  ALTER COLUMN geom TYPE geometry(Geometry, 4326) USING ST_Transform(geom, 4326);
ALTER TABLE public._debug_is_sidepath_paths
  ALTER COLUMN geom TYPE geometry(Geometry, 4326) USING ST_Transform(geom, 4326);
ALTER TABLE public._debug_is_sidepath_roads
  ALTER COLUMN geom TYPE geometry(Geometry, 4326) USING ST_Transform(geom, 4326);

CREATE INDEX _debug_is_sidepath_checkpoints_geom_idx ON public._debug_is_sidepath_checkpoints USING GIST (geom);
CREATE INDEX _debug_is_sidepath_matches_geom_idx ON public._debug_is_sidepath_matches USING GIST (geom);
CREATE INDEX _debug_is_sidepath_paths_geom_idx ON public._debug_is_sidepath_paths USING GIST (geom);
CREATE INDEX _debug_is_sidepath_roads_geom_idx ON public._debug_is_sidepath_roads USING GIST (geom);
