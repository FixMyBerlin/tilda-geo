-- Derived bikelane lines stay on the road centerline.
-- Left side (`offset` > 0) runs against the OSM way.
-- Right side (`offset` < 0) runs with the OSM way.
--
DO $$ BEGIN RAISE NOTICE 'START orient bikelane direction %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

UPDATE bikelanes
SET
  geom = ST_Reverse (geom)
WHERE
  (tags ->> 'offset')::numeric > 0;

DO $$ BEGIN RAISE NOTICE 'END orient bikelane direction %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
