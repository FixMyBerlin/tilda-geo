DO $$ BEGIN RAISE NOTICE 'START cutting out _parking_parkings_cutted at %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _parking_parkings_cutted;

SELECT
  COALESCE(p.id || '/' || d.path[1], p.id) AS id,
  p.osm_type,
  p.osm_id,
  p.side,
  p.tags,
  'parkings' as source,
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
            AND (
              NOT c.tags ? 'street:name'
              OR c.tags ->> 'street:name' = p.street_name
            )
            AND (
              c.tags ->> 'category' <> 'bus_stop'
              OR c.tags ->> 'side' = p.side
            )
        )
      ),
      p.geom
    )
  ) AS d;
