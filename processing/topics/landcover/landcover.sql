/* sql-formatter-disable */
--
-- Entry point for landcover SQL post-processing (runs after landcover.lua).
-- Each dataset's SQL lives in its own folder; this file only orchestrates the includes.
--
\i '/processing/topics/landcover/landuse/cleanup.sql'
\i '/processing/topics/landcover/settlement_areas/dissolve.sql'
\i '/processing/topics/landcover/buildings/filter.sql'

DO $$ BEGIN RAISE NOTICE 'FINISH topics/landcover/landcover.sql at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
