DROP TABLE IF EXISTS parkings;

SELECT
  COALESCE(p.id || '/' || d.path[1], p.id) AS id,
  p.osm_type,
  p.osm_id,
  p.side,
  p.tags,
  p.meta,
  d.geom INTO parkings
FROM
  _parking_parkings p,
  LATERAL ST_Dump (
    ST_Difference (
      p.geom,
      (
        SELECT
          ST_Union (c.geom)
        FROM
          _parking_cutout_areas c
        WHERE
          c.geom && p.geom
      )
    )
  ) AS d;

-- MISC
ALTER TABLE parkings
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parkings_geom_idx ON parkings USING GIST (geom);

DO $$
BEGIN
  RAISE NOTICE 'Finished cutting out parkings at %', clock_timestamp();
END
$$;
