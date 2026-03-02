-- WHAT IT DOES:
-- Quality checks for Branch 2 (bus_stop_centerline without direction: platform then kerb two-step).
-- Populates _parking_public_transport_platform_kerb_errors with candidates for manual review.
--
-- Cases: 1. shallow_platform_angle  2. parallel_platforms_side_swap  3. same_platform_both_sides
--
-- OUTPUT: _parking_public_transport_platform_kerb_errors (category, task, *_id columns, optional extra, geom)
-- geom: line(s) from projected point (on kerb) to original bus stop point, for visual inspection of angle and relation
-- Run after: public_transport/0_points_project_to_kerb_and_platform.sql
--
DO $$ BEGIN RAISE NOTICE 'START platform/kerb debug errors at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_public_transport_platform_kerb_errors;

CREATE TABLE _parking_public_transport_platform_kerb_errors (
  category TEXT NOT NULL,
  task TEXT NOT NULL,
  bus_stop_id TEXT,
  bus_stop_id_2 TEXT,
  bus_stop_ids TEXT[],
  via_platform_id TEXT,
  kerb_id TEXT,
  kerb_osm_id BIGINT,
  kerb_side TEXT,
  projection_angle_deg NUMERIC, -- Case 1 only: degrees off perpendicular (0=good, 90=parallel/bad)
  geom GEOMETRY (Geometry, 5243)
);

-- Only Branch 2 rows (two-step: platform then kerb)
CREATE TEMP TABLE _branch2_projected AS
SELECT
  p.id,
  p.source_id AS bus_stop_id,
  p.source ->> '_via_platform_id' AS via_platform_id,
  p.source ->> 'kerb_id' AS kerb_id,
  (p.source ->> 'kerb_osm_id')::BIGINT AS kerb_osm_id,
  p.source ->> 'kerb_side' AS kerb_side,
  p.geom AS kerb_geom
FROM
  _parking_public_transport_points_projected p
WHERE
  p.source ? '_via_platform_id';

-- ---------------------------------------------------------------------------
-- Case 1: shallow_platform_angle
-- Platform short, so bus stop projects at shallow angle (~30°) instead of ~90°; after re-projection to kerb
-- the position may be shifted. Angle between (stop->point_on_platform) and (platform direction at that point)
-- should be ~90°. Flag when angle is far from 90° (degrees off perpendicular > 25°).
-- ---------------------------------------------------------------------------
INSERT INTO
  _parking_public_transport_platform_kerb_errors (
    category,
    task,
    bus_stop_id,
    via_platform_id,
    kerb_id,
    kerb_osm_id,
    kerb_side,
    projection_angle_deg,
    geom
  )
SELECT
  'shallow_platform_angle' AS category,
  'Check: The bus stop was projected to the platform first and then to the kerb. This changed its position compared to where it was on the centerline, likely because the platform geometry is flawed. Add a direction tag on the bus stop node (ideal) or adjust the platform geometry (also OK).' AS task,
  b.bus_stop_id,
  b.via_platform_id,
  b.kerb_id,
  b.kerb_osm_id,
  b.kerb_side,
  ROUND(ang.angle_deg::NUMERIC, 2) AS projection_angle_deg,
  ST_MakeLine (b.kerb_geom, stop.geom)::GEOMETRY (Geometry, 5243) AS geom
FROM
  _branch2_projected b
  JOIN _parking_public_transport stop ON stop.id = b.bus_stop_id
  JOIN _parking_public_transport plat ON plat.id = b.via_platform_id
  AND ST_GeometryType (plat.geom) = 'ST_LineString'
  CROSS JOIN LATERAL (
    SELECT
      ST_ClosestPoint (plat.geom, stop.geom) AS point_on_platform
  ) AS proj
  CROSS JOIN LATERAL (
    SELECT
      ST_LineLocatePoint (plat.geom, proj.point_on_platform) AS frac
  ) AS loc
  CROSS JOIN LATERAL (
    SELECT
      ST_Azimuth (stop.geom, proj.point_on_platform) AS az_stop_to_platform,
      ST_Azimuth (
        ST_LineInterpolatePoint (plat.geom, GREATEST(0, loc.frac - 0.02)),
        ST_LineInterpolatePoint (plat.geom, LEAST(1, loc.frac + 0.02))
      ) AS az_platform
  ) AS az
  CROSS JOIN LATERAL (
    -- Angle between (stop->point_on_platform) and platform tangent. Perpendicular = 0° or 180°, parallel = 90°.
    SELECT
      degrees(
        abs(
          acos(
            cos(
              az.az_stop_to_platform - az.az_platform - pi() / 2
            )
          )
        )
      ) AS angle_deg
  ) AS ang
WHERE
  ang.angle_deg > 25
  AND ang.angle_deg < 155;

-- ---------------------------------------------------------------------------
-- Case 2: parallel_platforms_side_swap
-- Two stops P1, P2 on same road get left/right assigned but might be swapped. Same road (same kerb way),
-- both sides present; flag when each stop point falls in the "other" platform buffer (possible side swap).
-- ---------------------------------------------------------------------------
INSERT INTO
  _parking_public_transport_platform_kerb_errors (
    category,
    task,
    bus_stop_id,
    bus_stop_id_2,
    via_platform_id,
    kerb_id,
    kerb_osm_id,
    kerb_side,
    geom
  )
SELECT
  'parallel_platforms_side_swap' AS category,
  'Check: We projected two points to side left|right but we cannot be sure it is the right side because both platforms overlap. This means we might create cutouts at the wrong road segment. Add a direction tag to the bus stop node (ideal) or verify the sides are correct (more error prone).' AS task,
  a.bus_stop_id,
  b.bus_stop_id AS bus_stop_id_2,
  a.via_platform_id,
  a.kerb_id,
  a.kerb_osm_id,
  a.kerb_side,
  ST_Collect (
    ST_MakeLine (a.kerb_geom, sta.geom),
    ST_MakeLine (b.kerb_geom, stb.geom)
  )::GEOMETRY (Geometry, 5243) AS geom
FROM
  _branch2_projected a
  JOIN _branch2_projected b ON a.kerb_osm_id = b.kerb_osm_id
  AND a.bus_stop_id < b.bus_stop_id
  AND a.kerb_side <> b.kerb_side
  JOIN _parking_public_transport sta ON sta.id = a.bus_stop_id
  JOIN _parking_public_transport stb ON stb.id = b.bus_stop_id
  JOIN _parking_public_transport pla ON pla.id = a.via_platform_id
  AND ST_GeometryType (pla.geom) = 'ST_LineString'
  JOIN _parking_public_transport plb ON plb.id = b.via_platform_id
  AND ST_GeometryType (plb.geom) = 'ST_LineString'
WHERE
  ST_DWithin (sta.geom, stb.geom, 50)
  AND ST_Intersects (sta.geom, ST_Buffer (plb.geom, 8, 'endcap=flat'))
  AND ST_Intersects (stb.geom, ST_Buffer (pla.geom, 8, 'endcap=flat'));

-- ---------------------------------------------------------------------------
-- Case 3: same_platform_both_sides
-- P1 and P2 both project to the same platform (same side); one might actually be on the other side.
-- Flag when multiple Branch 2 stops share via_platform_id.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS _branch2_same_platform;

CREATE TEMP TABLE _branch2_same_platform AS
SELECT
  b.via_platform_id,
  array_agg(
    b.bus_stop_id
    ORDER BY
      b.bus_stop_id
  ) AS bus_stop_ids,
  (
    array_agg(
      b.kerb_id
      ORDER BY
        b.bus_stop_id
    )
  ) [1] AS kerb_id,
  (
    array_agg(
      b.kerb_osm_id
      ORDER BY
        b.bus_stop_id
    )
  ) [1] AS kerb_osm_id,
  (
    array_agg(
      b.kerb_side
      ORDER BY
        b.bus_stop_id
    )
  ) [1] AS kerb_side
FROM
  _branch2_projected b
GROUP BY
  b.via_platform_id
HAVING
  count(*) > 1;

INSERT INTO
  _parking_public_transport_platform_kerb_errors (
    category,
    task,
    bus_stop_ids,
    via_platform_id,
    kerb_id,
    kerb_osm_id,
    kerb_side,
    geom
  )
SELECT
  'same_platform_both_sides' AS category,
  'Check: Multiple bus stops projected to the same platform. Check if there is a platform on the other side that one should project to. Add a direction tag on the bus stop so the node can project to the right kerb. Keep as is if in fact only one platform exists.' AS task,
  g.bus_stop_ids,
  g.via_platform_id,
  g.kerb_id,
  g.kerb_osm_id,
  g.kerb_side,
  (
    SELECT
      ST_Collect (sub.line_geom)
    FROM
      (
        SELECT
          ST_MakeLine (b.kerb_geom, pt.geom) AS line_geom
        FROM
          unnest(g.bus_stop_ids) AS bid
          JOIN _branch2_projected b ON b.bus_stop_id = bid
          JOIN _parking_public_transport pt ON pt.id = bid
      ) sub
  )::GEOMETRY (Geometry, 5243) AS geom
FROM
  _branch2_same_platform g;

DROP TABLE IF EXISTS _branch2_same_platform;

DROP TABLE IF EXISTS _branch2_projected;

CREATE INDEX _parking_public_transport_platform_kerb_errors_geom_idx ON _parking_public_transport_platform_kerb_errors USING GIST (geom);

CREATE INDEX _parking_public_transport_platform_kerb_errors_category_idx ON _parking_public_transport_platform_kerb_errors (category);

DO $$ BEGIN RAISE NOTICE 'END platform/kerb debug errors at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
