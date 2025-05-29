-- This script processes the 'landuse' table to generate a new table '_landuse_settlements' representing merged, simplified, and cleaned settlement areas.
-- It dissolves and buffers landuse polygons, removes holes, and simplifies the resulting geometries to create large, contiguous settlement areas.
-- Small areas are filtered out unless they correspond to a place (excluding hamlets), and relevant place information is added to the tags column.
-- The script applies multiple geometry cleaning steps to avoid topology errors and ensures the output is valid for use in vector tile services.
-- The resulting table is indexed spatially and uses SRID 3857 for compatibility with web mapping tools.
--
DROP TABLE IF EXISTS public._landuse_settlements;

CREATE TABLE public._landuse_settlements AS
WITH
  simplified_input AS (
    SELECT
      ST_SimplifyPreserveTopology (ST_MakeValid (geom), 100) AS geom
    FROM
      landuse
  ),
  dissolved AS (
    SELECT
      ST_MakeValid (
        ST_UnaryUnion (
          ST_Collect (
            ST_MakeValid (ST_Buffer (ST_MakeValid (geom), 150))
          )
        )
      ) AS geom
    FROM
      simplified_input
  ),
  no_holes AS (
    SELECT
      (ST_Dump (geom)).geom AS geom
    FROM
      dissolved
  ),
  exteriors AS (
    SELECT
      ST_MakePolygon (ST_ExteriorRing (geom)) AS geom
    FROM
      no_holes
  ),
  simplified AS (
    SELECT
      ST_SimplifyPreserveTopology (geom, 100) AS geom
    FROM
      exteriors
  ),
  with_places AS (
    SELECT
      row_number() OVER () AS id,
      CASE
        WHEN p.id IS NOT NULL
        AND (p.tags ->> 'place') IS DISTINCT FROM 'hamlet' THEN jsonb_build_object(
          'place_id',
          p.id,
          'place_name',
          p.tags ->> 'name',
          'place',
          p.tags ->> 'place',
          'area',
          ST_Area (geom)
        )
        ELSE jsonb_build_object('area', ST_Area (geom))
      END AS tags,
      s.geom
    FROM
      simplified s
      LEFT JOIN LATERAL (
        SELECT
          id,
          tags
        FROM
          places p
        WHERE
          ST_Intersects (s.geom, p.geom)
        LIMIT
          1
      ) p ON TRUE
  )
SELECT
  id,
  tags,
  geom
FROM
  with_places
WHERE
  ST_Area (geom) >= 1000000
  OR (tags ? 'place_id');

ALTER TABLE public._landuse_settlements
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_SetSRID (geom, 3857);

CREATE INDEX ON public._landuse_settlements USING GIST (geom);
