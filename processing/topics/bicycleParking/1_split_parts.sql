-- WHAT IT DOES:
-- Gives the two parts of a split OSM object (a `bicycle_parking` and a `cargo_bike_parking` row, see
-- helper/kind_parts.lua) their own geometry. Lua marks the parts with `tags.geometry_transform` by
-- geometry type; each section below handles one value.
-- INPUT: bicycleParking_points, bicycleParking_areas, _bicycleParking_lines
-- OUTPUT: bicycleParking_points and bicycleParking_areas (3857), split rows updated in place.
-- Intermediates are TEMP. `_bicycleParking_lines` stays in the database (`_` tables are not exposed).

-- Split objects: the two rows of one OSM object (same osm_type + osm_id) that Lua marked.
-- For the area cut, the stands are taken as one row, each stand across the row: a part's length is
-- capacity / 2 (stands) * stand spacing (a bicycle stand every 1.2 m, a cargo bike stand every 2.0 m).
-- A capacity that is not set counts as 1 space.
DROP TABLE IF EXISTS _bicycle_parking_splits;

CREATE TEMP TABLE _bicycle_parking_splits AS
WITH parts AS (
  SELECT
    osm_type,
    osm_id,
    id,
    tags ->> 'kind' AS kind,
    tags ->> 'geometry_transform' AS geometry_transform,
    COALESCE((tags ->> 'capacity')::NUMERIC, 1) AS capacity
  FROM public."bicycleParking_points"
  WHERE tags ? 'geometry_transform'
),
per_object AS (
  SELECT
    MAX(geometry_transform) AS geometry_transform,
    MAX(id) FILTER (WHERE kind = 'bicycle_parking') AS bike_id,
    MAX(id) FILTER (WHERE kind = 'cargo_bike_parking') AS cargo_id,
    MAX(capacity) FILTER (WHERE kind = 'bicycle_parking') / 2 * 1.2 AS bike_length,
    MAX(capacity) FILTER (WHERE kind = 'cargo_bike_parking') / 2 * 2.0 AS cargo_length
  FROM parts
  GROUP BY osm_type, osm_id
)
SELECT geometry_transform, bike_id, cargo_id, bike_length / (bike_length + cargo_length) AS share
FROM per_object
WHERE bike_id IS NOT NULL AND cargo_id IS NOT NULL;

-- `area_split` (closed ways and multipolygon relations): the outline is cut across its long axis by the
-- share, the bicycle part on the min end (tilda_bicycle_parking_split_area). Each point lies on its part.
DROP TABLE IF EXISTS _bicycle_parking_area_splits;

CREATE TEMP TABLE _bicycle_parking_area_splits AS
SELECT s.bike_id, s.cargo_id, tilda_bicycle_parking_split_area(a.geom, s.share) AS parts
FROM _bicycle_parking_splits AS s
JOIN public."bicycleParking_areas" AS a ON a.id = s.bike_id
WHERE s.geometry_transform = 'area_split';

UPDATE public."bicycleParking_areas" AS a
SET geom = CASE WHEN a.id = s.bike_id THEN s.parts[1] ELSE s.parts[2] END
FROM _bicycle_parking_area_splits AS s
WHERE a.id IN (s.bike_id, s.cargo_id);

UPDATE public."bicycleParking_points" AS p
SET geom = ST_PointOnSurface(a.geom)
FROM public."bicycleParking_areas" AS a
WHERE a.id = p.id
  AND a.tags ->> 'geometry_transform' = 'area_split';

-- `line_halves` (open ways): the line is cut in the middle; each point lies in the middle of its half.
UPDATE public."bicycleParking_points" AS p
SET geom = ST_LineInterpolatePoint(l.geom, CASE WHEN p.id = s.bike_id THEN 0.25 ELSE 0.75 END)
FROM _bicycle_parking_splits AS s
JOIN public."_bicycleParking_lines" AS l ON l.id = s.bike_id
WHERE s.geometry_transform = 'line_halves'
  AND p.id IN (s.bike_id, s.cargo_id);

-- `point_offset` (nodes): the two parts are placed side by side, 1 m west (bicycle) and 1 m east
-- (cargo bike) of the node.
UPDATE public."bicycleParking_points" AS p
SET geom = ST_Transform(
  ST_Translate(ST_Transform(p.geom, 5243), CASE WHEN p.id = s.bike_id THEN -1 ELSE 1 END, 0),
  3857
)
FROM _bicycle_parking_splits AS s
WHERE s.geometry_transform = 'point_offset'
  AND p.id IN (s.bike_id, s.cargo_id);
