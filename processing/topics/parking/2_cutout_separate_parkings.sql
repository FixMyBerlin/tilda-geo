DO $$ BEGIN RAISE NOTICE 'START cutting out separate parkings at %', clock_timestamp(); END $$;

SELECT
  * INTO TEMP separate_parking_cutouts
FROM
  _parking_cutouts
WHERE
  tags ->> 'source' IN (
    'crossing',
    'driveways',
    'obstacle_points',
    'obstacle_areas',
    'obstacle_lines'
  )
  AND tags ->> 'category' IS DISTINCT FROM 'kerb_lowered';

CREATE INDEX separate_parking_cutouts_geom_idx ON separate_parking_cutouts USING GIST (geom);

-- INFO: Drop table happesn in cutout_parkings.sql
--
-- PROCESS
INSERT INTO
  _parking_parkings_cutted (
    id,
    original_id,
    osm_id,
    tag_source,
    geom_source,
    tags,
    side,
    meta,
    geom
  )
SELECT
  COALESCE(p.id || '/' || d.path[1], p.id),
  p.id,
  p.osm_id,
  osm_ref (p.osm_type, p.osm_id) AS tag_source,
  osm_ref (p.kerb_osm_type, p.kerb_osm_id) AS geom_source,
  p.tags || '{"source": "separate_parking_areas"}'::JSONB,
  p.kerb_side,
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
            separate_parking_cutouts c
          WHERE
            c.geom && p.geom
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
    original_id,
    osm_id,
    tag_source,
    geom_source,
    tags,
    side,
    meta,
    geom
  )
SELECT
  COALESCE(p.id || '/' || d.path[1], p.id),
  p.id,
  osm_id,
  osm_ref (p.osm_type, p.osm_id) AS tag_source,
  osm_ref (p.kerb_osm_type, p.kerb_osm_id) AS geom_source,
  p.tags || '{"source": "separate_parking_points"}'::JSONB,
  p.kerb_side,
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
            separate_parking_cutouts c
          WHERE
            c.geom && p.geom
        )
      ),
      p.geom
    )
  ) AS d;

-- MISC
ALTER TABLE _parking_parkings_cutted
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_parkings_cut_geom_idx ON _parking_parkings_cutted USING GIST (geom);

CREATE INDEX parking_parkings_cut_original_id_idx ON _parking_parkings_cutted (original_id);

CREATE INDEX parking_parkings_cut_street_name_idx ON _parking_parkings_cutted (street_name);
