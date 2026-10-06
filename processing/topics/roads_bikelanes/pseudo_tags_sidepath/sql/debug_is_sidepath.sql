-- Debug tables for is_sidepath estimation. Martin-compatible (public schema, geom + tags).
-- Reads the step tables of is_sidepath_estimation.sql (_sidepath_estimation_checkpoints, _hits, _result),
-- so include it in run_is_sidepath_estimation.sql after that file and before the final DROPs.
-- All inputs are in 3857, so buffer_distance/buffer_size are meters.
-- At the end we ST_Transform(geom, 4326) only for Martin display.

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
    'road', r.road,
    'name', r.name,
    'layer', r.layer,
    'maxspeed', r.maxspeed
  )
FROM public._sidepath_estimation_roads r;

INSERT INTO public._debug_is_sidepath_checkpoints (geom, tags)
SELECT
  ST_Buffer(c.geom, :buffer_size),
  jsonb_build_object(
    'path_osm_id', c.osm_id,
    'checkpoint_nr', c.nr,
    'layer', c.layer
  )
FROM public._sidepath_estimation_checkpoints c;

-- Only hits that vote (same layer as the checkpoint).
INSERT INTO public._debug_is_sidepath_matches (geom, tags)
SELECT
  r.geom,
  jsonb_build_object(
    'path_osm_id', h.osm_id,
    'checkpoint_nr', h.nr,
    'road_osm_id', r.osm_id,
    'road_highway', r.road,
    'road_name', r.name,
    'road_layer', r.layer
  )
FROM public._sidepath_estimation_hits h
JOIN public._sidepath_estimation_roads r ON r.osm_id = h.road_id;

WITH checks AS (
  SELECT osm_id, count(*) AS checks
  FROM public._sidepath_estimation_checkpoints
  GROUP BY osm_id
),
road_votes AS (
  SELECT osm_id, jsonb_object_agg(road, votes) AS road_votes
  FROM (
    SELECT osm_id, road, count(DISTINCT (path_nr, nr)) AS votes
    FROM public._sidepath_estimation_hits
    GROUP BY osm_id, road
  ) v
  GROUP BY osm_id
)
INSERT INTO public._debug_is_sidepath_paths (geom, tags)
SELECT
  p.geom,
  jsonb_build_object(
    'osm_id', res.osm_id,
    'is_sidepath_estimation', res.is_sidepath_estimation,
    'checks', c.checks,
    'road_votes', v.road_votes,
    'adjoining_road', res.adjoining_road,
    'adjoining_maxspeed', res.adjoining_maxspeed
  )
FROM public._sidepath_estimation_result res
JOIN checks c ON c.osm_id = res.osm_id
LEFT JOIN road_votes v ON v.osm_id = res.osm_id
JOIN public._sidepath_estimation_paths p ON p.osm_id = res.osm_id AND NOT p.is_crossing;

INSERT INTO public._debug_is_sidepath_paths (geom, tags)
SELECT
  p.geom,
  jsonb_build_object(
    'osm_id', p.osm_id,
    'is_crossing', true,
    'is_sidepath_estimation', 'false'
  )
FROM public._sidepath_estimation_paths p
WHERE p.is_crossing;

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
