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

-- MISC
ALTER TABLE _parking_parkings_cutted
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_parkings_cut_geom_idx ON _parking_parkings_cutted USING GIST (geom);

CREATE INDEX parking_parkings_cut_osm_id_idx ON _parking_parkings_cutted (osm_id);

CREATE INDEX parking_parkings_cut_osm_id_side_idx ON _parking_parkings_cutted (osm_id, side);

CREATE INDEX parking_parkings_cut_street_name_idx ON _parking_parkings_cutted (street_name);
