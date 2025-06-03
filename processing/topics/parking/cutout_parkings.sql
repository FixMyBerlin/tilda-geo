DROP TABLE IF EXISTS parkings;

SELECT
  osm_type,
  osm_id,
  id,
  side,
  tags,
  meta,
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
  ) AS geom INTO parkings
FROM
  _parking_parkings p;

-- MISC
ALTER TABLE parkings
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parkings_geom_idx ON parkings USING GIST (geom);

DO $$
BEGIN
  RAISE NOTICE 'Finished cutting out parkings at %', clock_timestamp();
END
$$;
