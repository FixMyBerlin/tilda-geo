DO $$ BEGIN RAISE NOTICE 'START projecting obstacle lines at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_obstacle_lines_projected CASCADE;

ALTER TABLE _parking_obstacle_lines
ADD COLUMN separate_parking_area_id TEXT;

UPDATE _parking_obstacle_lines AS pol
SET
  separate_parking_area_id = spa.id
FROM
  _parking_separate_parking_areas AS spa
WHERE
  ST_Intersects (pol.geom, spa.geom);

-- CREATE "lines projected"
CREATE TABLE _parking_obstacle_lines_projected AS
SELECT
  pol.id || '-' || pk.kerb_id AS id,
  pol.osm_type,
  pol.osm_id,
  pol.id as source_id,
  pol.tags || jsonb_build_object(
    'tag_sources',
    pol.id,
    'geom_sources',
    pk.kerb_id,
    'separate_parking',
    FALSE
  ) as tags,
  pol.meta,
  pk.*
FROM
  _parking_obstacle_lines pol
  CROSS JOIN LATERAL project_to_k_closest_kerbs (pol.geom, tolerance := 2, k := 6) AS pk
WHERE
  pol.separate_parking_area_id IS NULL;

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
  pol.id || '-' || spap.id AS id,
  pol.osm_type,
  pol.osm_id,
  pol.id,
  pol.tags || jsonb_build_object(
    'tag_sources',
    pol.id,
    'geom_sources',
    spap.id,
    'separate_parking',
    TRUE
  ) as tags,
  pol.meta,
  project_to_line (
    project_from := pol.geom,
    project_onto := spap.geom
  ),
  spap.id as kerb_id,
  spap.osm_type,
  spap.osm_id,
  spap.side,
  spap.tags,
  TRUE,
  FALSE,
  ST_Distance (pol.geom, spap.geom)
FROM
  _parking_obstacle_lines pol
  JOIN _parking_separate_parking_areas_projected spap ON pol.separate_parking_area_id = spap.source_id;

DELETE FROM _parking_obstacle_lines_projected
WHERE
  (source_id, kerb_distance) IN (
    SELECT
      source_id,
      MAX(kerb_distance)
    FROM
      _parking_obstacle_lines_projected
    GROUP BY
      source_id
    HAVING
      count(*) > 1
  );

DELETE FROM _parking_obstacle_lines_projected
WHERE
  geom IS NULL
  OR ST_GeometryType (geom) <> 'ST_LineString'
  OR ST_Length (geom) < 0.3;

-- MISC
ALTER TABLE _parking_obstacle_lines_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_obstacle_lines_projected_geom_idx ON _parking_obstacle_lines_projected USING gist (geom);
