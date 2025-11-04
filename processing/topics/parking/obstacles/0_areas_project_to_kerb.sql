DO $$ BEGIN RAISE NOTICE 'START projecting obstacle areas at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_obstacle_areas_projected CASCADE;

ALTER TABLE _parking_obstacle_areas
ADD COLUMN separate_parking_area_id TEXT;

UPDATE _parking_obstacle_areas AS a
SET
  separate_parking_area_id = spa.id
FROM
  _parking_separate_parking_areas AS spa
WHERE
  ST_Intersects (a.geom, spa.geom);

-- CREATE "areas projected"
CREATE TABLE _parking_obstacle_areas_projected AS
SELECT
  a.id || '-' || pk.kerb_id AS id,
  a.osm_type,
  a.osm_id,
  a.id as source_id,
  a.tags || jsonb_build_object(
    'tag_sources',
    a.id,
    'geom_sources',
    pk.kerb_id,
    'separate_parking',
    FALSE
  ) as tags,
  a.meta,
  pk.*
FROM
  _parking_obstacle_areas a
  CROSS JOIN LATERAL project_to_k_closest_kerbs (a.geom, tolerance := 2, k := 6) AS pk
WHERE
  a.separate_parking_area_id IS NULL;

INSERT INTO
  _parking_obstacle_areas_projected (
    id,
    osm_type,
    osm_id,
    source_id,
    tags,
    meta,
    geom,
    kerb_id,
    kerb_osm_type,
    kerb_osm_id,
    kerb_side,
    kerb_tags,
    kerb_has_parking,
    kerb_is_driveway,
    kerb_distance
  )
SELECT
  a.id || '-' || spap.id AS id,
  a.osm_type,
  a.osm_id,
  a.id,
  a.tags || jsonb_build_object(
    'tag_sources',
    a.id,
    'geom_sources',
    spap.id,
    'separate_parking',
    TRUE
  ) as tags,
  a.meta,
  project_to_line (project_from := a.geom, project_onto := spap.geom),
  spap.id as kerb_id,
  spap.osm_type,
  spap.osm_id,
  spap.side,
  spap.tags,
  TRUE,
  FALSE,
  ST_Distance (a.geom, spap.geom)
FROM
  _parking_obstacle_areas a
  JOIN _parking_separate_parking_areas_projected spap ON a.separate_parking_area_id = spap.source_id;

DELETE FROM _parking_obstacle_areas_projected
WHERE
  (source_id, kerb_distance) IN (
    SELECT
      source_id,
      MAX(kerb_distance)
    FROM
      _parking_obstacle_areas_projected
    GROUP BY
      source_id
    HAVING
      count(*) > 1
  );

DELETE FROM _parking_obstacle_areas_projected
WHERE
  geom IS NULL
  OR ST_GeometryType (geom) <> 'ST_LineString'
  OR ST_Length (geom) < 0.3;

-- MISC
ALTER TABLE _parking_obstacle_areas_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_obstacle_areas_projected_geom_idx ON _parking_obstacle_areas_projected USING gist (geom);
