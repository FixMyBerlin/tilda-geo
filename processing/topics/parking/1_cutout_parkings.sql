DO $$ BEGIN RAISE NOTICE 'START cutting out parkings at %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS parkings;

SELECT
  COALESCE(p.id || '/' || d.path[1], p.id) AS id,
  p.osm_type,
  p.osm_id,
  p.side,
  p.tags,
  p.meta,
  p.street_name,
  d.geom INTO parkings
FROM
  _parking_parkings p,
  LATERAL ST_Dump (
    COALESCE(
      ST_Difference (
        p.geom,
        (
          SELECT
            ST_Union (c.geom)
          FROM
            _parking_cutouts c
          WHERE
            c.geom && p.geom
            AND (
              NOT c.tags ? 'street:name'
              OR c.tags ->> 'street:name' = p.street_name
            )
        )
      ),
      p.geom
    )
  ) AS d;

-- MISC
ALTER TABLE parkings
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parkings_geom_idx ON parkings USING GIST (geom);
