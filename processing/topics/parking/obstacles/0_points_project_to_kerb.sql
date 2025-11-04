DO $$ BEGIN RAISE NOTICE 'START projecting obstacle points at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_obstacle_points_projected CASCADE;

ALTER TABLE _parking_obstacle_points
ADD COLUMN separate_parking_area_id TEXT;

UPDATE _parking_obstacle_points AS p
SET
  separate_parking_area_id = spa.id
FROM
  _parking_separate_parking_areas AS spa
WHERE
  ST_Intersects (p.geom, spa.geom);

-- INSERT
CREATE TABLE _parking_obstacle_points_projected AS
SELECT
  p.id || '-' || pk.kerb_id AS id,
  p.osm_type,
  p.osm_id,
  p.id as source_id,
  p.tags || jsonb_build_object(
    'tag_sources',
    p.id,
    'geom_sources',
    pk.kerb_id,
    'separate_parking',
    FALSE
  ) as tags,
  p.meta,
  pk.*
FROM
  _parking_obstacle_points p
  CROSS JOIN LATERAL project_to_k_closest_kerbs (p.geom, tolerance := 5, k := 1) AS pk
WHERE
  p.separate_parking_area_id IS NULL;

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
  p.id || '-' || spap.id AS id,
  p.osm_type,
  p.osm_id,
  p.id,
  p.tags || jsonb_build_object(
    'tag_sources',
    p.id,
    'geom_sources',
    spap.id,
    'separate_parking',
    TRUE
  ) as tags,
  p.meta,
  project_to_line (project_from := p.geom, project_onto := spap.geom),
  spap.id as kerb_id,
  spap.osm_type,
  spap.osm_id,
  spap.side,
  spap.tags,
  TRUE,
  FALSE,
  ST_Distance (p.geom, spap.geom)
FROM
  _parking_obstacle_points p
  JOIN _parking_separate_parking_areas_projected spap ON p.separate_parking_area_id = spap.source_id;

DELETE FROM _parking_obstacle_points_projected
WHERE
  (source_id, kerb_distance) IN (
    SELECT
      source_id,
      MAX(kerb_distance)
    FROM
      _parking_obstacle_points_projected
    GROUP BY
      source_id
    HAVING
      count(*) > 1
  );

-- CLEANUP
DELETE FROM _parking_obstacle_points_projected
WHERE
  geom IS NULL;

-- MISC
ALTER TABLE _parking_obstacle_points_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_obstacle_points_projected_geom_idx ON _parking_obstacle_points_projected USING gist (geom);
