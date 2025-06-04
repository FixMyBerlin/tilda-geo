INSERT INTO
  parkings (id, osm_type, osm_id, tags, meta, geom)
SELECT
  COALESCE(p.id || '/' || d.path[1], p.id) AS id,
  p.osm_type,
  osm_id,
  p.tags,
  p.meta,
  d.geom
FROM
  _parking_separate_parking_areas_projected p,
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
            AND c.tags ->> 'source' <> 'separate_parking_areas'
        )
      ),
      p.geom
    )
  ) AS d;

DO $$
BEGIN
  RAISE NOTICE 'Finished cutting out separate parkings at %', clock_timestamp();
END
$$;
