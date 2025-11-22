-- WHAT IT DOES:
-- Applies cutouts to parking lines derived from roads (centerline data).
-- Some cutouts are conditional:
-- - Street name matching: When both cutout and parking have a street name, they must match
-- - Bus stop side matching: Bus stop cutouts only apply to matching street side, other cutouts apply to both sides
-- INPUT: `_parking_road_parkings` (linestring), `_parking_cutouts` (polygon)
-- OUTPUT: `_parking_parkings_cutted` (linestring - cut road parkings)
--
DO $$ BEGIN RAISE NOTICE 'START cutting out road parkings at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_parkings_cutted;

CREATE TABLE _parking_parkings_cutted AS
SELECT
  COALESCE(p.id || '/' || d.path[1], p.id) AS id,
  p.id as original_id,
  p.osm_id,
  tilda_osm_ref (p.osm_type, p.osm_id) AS tag_source,
  tilda_osm_ref (p.osm_type, p.osm_id) AS geom_source,
  p.side,
  p.tags || '{"source": "parkings"}'::JSONB as tags,
  p.meta,
  p.street_name,
  d.geom
FROM
  _parking_road_parkings p,
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
            AND
            -- When both cutout and parking have a street name, they must match
            (
              c.street_name = p.street_name
              OR c.street_name IS NULL
              OR p.street_name IS NULL
            )
            AND
            -- Only apply bus_stop cutouts to the correct side of the street
            -- This condition handles two cases:
            -- 1. Non-bus stop cutouts: Apply to both sides of the street
            --    e.g. A driveway cutout (category='driveway') will cut out parking on both sides
            -- 2. Bus stop cutouts: Only apply to matching street side
            --    e.g. A bus stop cutout with side='right' will only cut out parking where side='right'
            -- Using the new column instead of JSONB expression for better performance
            (
              c.category IS DISTINCT FROM 'bus_stop'
              OR c.side = p.side
            )
        )
      ),
      p.geom
    )
  ) AS d;
