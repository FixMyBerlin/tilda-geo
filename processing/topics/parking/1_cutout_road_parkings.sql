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
              c.tags ->> 'street:name' = p.street_name
              OR c.tags ->> 'street:name' IS NULL
              OR p.street_name IS NULL
            )
            AND
            -- Only apply public_transport_stops cutouts to the correct side of the street
            -- 1. Non-public-transport cutouts: Apply to both sides
            -- 2. Public transport cutouts: Only apply when sides match
            (
              c.tags ->> 'source' != 'public_transport_stops'
              OR c.tags ->> 'side' = p.side
            )
        )
      ),
      p.geom
    )
  ) AS d;
