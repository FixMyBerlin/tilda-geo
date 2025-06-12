DO $$ BEGIN RAISE NOTICE 'START cutting out _parking_parkings2_cut at %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _parking_parkings2_cut;

SELECT
  COALESCE(p.id || '/' || d.path[1], p.id) AS id,
  p.osm_type,
  p.osm_id,
  p.side,
  p.tags,
  p.meta,
  p.street_name,
  d.geom
  --
  INTO _parking_parkings2_cut
FROM
  _parking_parkings1_road p,
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
ALTER TABLE _parking_parkings2_cut
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_parkings2_cut_geom_idx ON _parking_parkings2_cut USING GIST (geom);
