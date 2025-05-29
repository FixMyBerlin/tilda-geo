-- This script selects all roads from public.roads and checks if at least 60% of their linestring is inside any _landuse_settlements area.
-- Only roads without a tags.maxspeed value are included.
-- The result is stored in a table _roads_in_settlements with a super simplified geometry (in the same SRID as _landuse_settlements) and a tags jsonb column containing the coverage percentage.
--
DROP TABLE IF EXISTS public._roads_in_settlements;

CREATE TABLE public._roads_in_settlements AS
WITH
  candidate_roads AS (
    SELECT
      r.osm_id,
      r.id,
      r.geom,
      r.tags
    FROM
      public.roads r
    WHERE
      NOT (r.tags ? 'maxspeed')
      AND NOT (r.tags ->> 'road') IN (
        'service_uncategorized',
        'service_road',
        'service_driveway',
        'service_parking_aisle',
        'bicycle_road',
        'pedestrian',
        'living_street',
        'track'
      )
  ),
  intersected AS (
    SELECT
      r.osm_id,
      r.id,
      r.geom,
      r.tags,
      ST_Intersection (r.geom, s.geom) AS covered_geom,
      ST_Length (r.geom) AS total_length,
      ST_Length (ST_Intersection (r.geom, s.geom)) AS covered_length
    FROM
      candidate_roads r
      JOIN public._landuse_settlements s ON ST_Intersects (r.geom, s.geom)
  ),
  coverage AS (
    SELECT
      osm_id,
      id,
      tags,
      total_length,
      GREATEST(covered_length, 0) AS covered_length,
      CASE
        WHEN total_length > 0 THEN GREATEST(covered_length, 0) / total_length
        ELSE 0
      END AS coverage,
      ST_SimplifyPreserveTopology (ST_Transform (geom, 3857), 10) AS geom
    FROM
      intersected
  )
SELECT
  osm_id,
  id,
  jsonb_build_object('coverage', coverage, 'road', tags -> 'road') AS tags,
  geom
FROM
  coverage
WHERE
  coverage >= 0.6;

ALTER TABLE public._roads_in_settlements
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_SetSRID (geom, 3857);

CREATE INDEX ON public._roads_in_settlements USING GIST (geom);
