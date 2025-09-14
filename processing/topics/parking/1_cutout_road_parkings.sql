DO $$ BEGIN RAISE NOTICE 'START cutting out _parking_parkings_cutted at %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _parking_parkings_cutted;

SELECT
  COALESCE(p.id || '/' || d.path[1], p.id) AS id,
  p.osm_type,
  p.osm_id,
  p.side,
  p.tags || '{"source": "parkings"}'::JSONB as tags,
  p.meta,
  p.street_name,
  d.geom
  --
  INTO _parking_parkings_cutted
FROM
  _parking_road_parkings p,
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
            AND
            -- when both cutout and parking have a street name, they must match
            (
              c.tags ->> 'street:name' = p.street_name
              OR c.tags ->> 'street:name' IS NULL
              OR p.street_name IS NULL
            )
            AND
            -- only apply bus_stop cutouts to the correct side of the street
            (
              (
                c.tags ->> 'category' <> 'bus_stop'
                OR c.tags ->> 'side' = p.side
              )
              OR c.tags ->> 'category' IS NULL
            )
        )
      ),
      p.geom
    )
  ) AS d;
