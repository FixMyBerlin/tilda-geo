-- WHAT IT DOES:
-- Applies cutouts to parking lines derived from roads (centerline data).
-- Some cutouts are conditional:
-- - Street name matching: When both cutout and parking have a street name, they must match
-- - Bus stop side matching: Bus stop cutouts only apply to matching street side, other cutouts apply to both sides
-- - Restriction segments: Cutouts with `no_cutout_for_restrictions=true` are not applied to segments whose condition_category indicates a real prohibition (no_parking, no_stopping, no_standing).
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
            -- When both cutout and parking have a street name, they must match
            AND (
              c.tags ->> 'street:name' = p.street_name
              OR c.tags ->> 'street:name' IS NULL
              OR p.street_name IS NULL
            )
            -- Only apply public_transport_stops cutouts to the correct side of the street
            -- 1. Non-public-transport cutouts: Apply to both sides
            -- 2. Public transport cutouts: Only apply when sides match
            AND (
              c.tags ->> 'source' != 'public_transport_stops'
              OR c.tags ->> 'side' = p.side
            )
            -- Do not apply cutouts with no_cutout_for_restrictions only to real prohibition segments (exact condition_category; NULL = apply cutout)
            AND NOT (
              (c.tags ->> 'no_cutout_for_restrictions') = 'true'
              AND (p.tags ->> 'condition_category') IS NOT NULL
              AND (p.tags ->> 'condition_category') IN ('no_parking', 'no_stopping', 'no_standing')
            )
        )
      ),
      p.geom
    )
  ) AS d;

DO $$ BEGIN RAISE NOTICE 'END cutting out road parkings at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
