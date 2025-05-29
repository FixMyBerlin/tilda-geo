-- This script selects all bikelanes from public.bikelanes that are outside of any landuse_settlements area.
-- Only bikelanes without a tags.is_sidepath or tags._parent_highway value are included.
-- The result is stored in a table _bikelanes_outside_settlements with a super simplified geometry (in the same SRID as landuse_settlements) and a tags jsonb column.
--
DROP TABLE IF EXISTS public._bikelanes_outside_settlements;

CREATE TABLE public._bikelanes_outside_settlements AS
WITH
  candidate_bikelanes AS (
    SELECT
      b.osm_id,
      b.id,
      b.geom,
      b.tags
    FROM
      public.bikelanes b
    WHERE
      NOT (b.tags ? 'is_sidepath')
      AND NOT (b.tags ? '_parent_highway')
  ),
  intersected AS (
    SELECT
      c.osm_id,
      c.id,
      c.geom,
      c.tags,
      ST_Length (c.geom) AS total_length,
      COALESCE(
        SUM(ST_Length (ST_Intersection (c.geom, s.geom))),
        0
      ) AS covered_length
    FROM
      candidate_bikelanes c
      LEFT JOIN public._landuse_settlements s ON ST_Intersects (c.geom, s.geom)
    GROUP BY
      c.osm_id,
      c.id,
      c.geom,
      c.tags
  ),
  coverage AS (
    SELECT
      osm_id,
      id,
      tags,
      total_length,
      GREATEST(covered_length, 0) AS covered_length,
      CASE
        WHEN total_length > 0 THEN 1 - (GREATEST(covered_length, 0) / total_length)
        ELSE 0
      END AS coverage,
      ST_SimplifyPreserveTopology (ST_Transform (geom, 3857), 10) AS geom
    FROM
      intersected
  )
SELECT
  osm_id,
  id,
  tags,
  geom
FROM
  coverage
WHERE
  coverage >= 0.6;

ALTER TABLE public._bikelanes_outside_settlements
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_SetSRID (geom, 3857);

CREATE INDEX ON public._bikelanes_outside_settlements USING GIST (geom);
