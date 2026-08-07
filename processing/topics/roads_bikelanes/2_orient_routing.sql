-- Virtual bikelanes stay on the road centerline.
-- Left side (`offset` > 0) runs against the OSM way.
-- Right side (`offset` < 0) runs with the OSM way.
-- Carriageway edges are travel-oriented and are not updated here.
--
DO $$ BEGIN RAISE NOTICE 'START orient routing virtual bikelane direction %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

UPDATE routing
SET
  geom = ST_Reverse (geom)
WHERE
  tags ->> 'segment_kind' = 'virtual_bikelane'
  AND (tags ->> 'offset')::numeric > 0;

DO $$ BEGIN RAISE NOTICE 'END orient routing virtual bikelane direction %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
