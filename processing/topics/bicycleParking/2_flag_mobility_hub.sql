-- WHAT IT DOES:
-- Flags the parkings inside a mobility hub area with `in_mobility_hub=yes`.
-- A mobility hub is an area that contains parkings; it is not counted as a parking itself
-- (tilda_measure_bicycle_parking). The hub's own area and point have kind=mobility_hub and are skipped.
-- INPUT: bicycleParking_points, bicycleParking_areas (after 1_split_parts.sql, so split parts are in place)
-- OUTPUT: tags.in_mobility_hub on bicycleParking_points and bicycleParking_areas

WITH hubs AS MATERIALIZED (
  SELECT geom FROM public."bicycleParking_areas" WHERE tags ->> 'kind' = 'mobility_hub'
)
UPDATE public."bicycleParking_points" AS parking
SET tags = parking.tags || '{"in_mobility_hub":"yes"}'::jsonb
WHERE parking.tags ->> 'kind' IS DISTINCT FROM 'mobility_hub'
  AND EXISTS (SELECT 1 FROM hubs WHERE ST_Intersects(hubs.geom, parking.geom));

WITH hubs AS MATERIALIZED (
  SELECT geom FROM public."bicycleParking_areas" WHERE tags ->> 'kind' = 'mobility_hub'
)
UPDATE public."bicycleParking_areas" AS parking
SET tags = parking.tags || '{"in_mobility_hub":"yes"}'::jsonb
WHERE parking.tags ->> 'kind' IS DISTINCT FROM 'mobility_hub'
  AND EXISTS (SELECT 1 FROM hubs WHERE ST_Intersects(hubs.geom, parking.geom));
