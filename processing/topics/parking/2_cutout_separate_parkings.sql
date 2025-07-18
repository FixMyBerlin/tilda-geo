DO $$ BEGIN RAISE NOTICE 'START cutting out separate parkings at %', clock_timestamp(); END $$;

-- INFO: Drop table happesn in cutout_parkings.sql
--
-- PROCESS
INSERT INTO
  _parking_parkings_cutted (
    id,
    osm_type,
    osm_id,
    tags,
    side,
    source,
    meta,
    geom
  )
SELECT
  COALESCE(
    p.kerb_id || '/' || p.id || '/' || d.path[1],
    p.kerb_id || '/' || p.id
  ),
  p.osm_type,
  osm_id,
  p.tags,
  p.kerb_side,
  'separate_parking_areas' as source,
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

-- INFO: Drop table happesn in cutout_parkings.sql
--
-- PROCESS
INSERT INTO
  _parking_parkings_cutted (
    id,
    osm_type,
    osm_id,
    tags,
    side,
    source,
    meta,
    geom
  )
SELECT
  COALESCE(
    p.kerb_id || '/' || p.id || '/' || d.path[1],
    p.kerb_id || '/' || p.id
  ),
  p.osm_type,
  osm_id,
  p.tags,
  p.kerb_side,
  'separate_parking_points' as source,
  p.meta,
  d.geom
FROM
  _parking_separate_parking_points_projected p,
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
            AND c.tags ->> 'source' <> 'separate_parking_points'
        )
      ),
      p.geom
    )
  ) AS d;
