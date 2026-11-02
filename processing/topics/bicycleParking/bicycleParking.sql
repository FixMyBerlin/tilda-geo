/* sql-formatter-disable */
--
-- Entry point for bicycleParking SQL post-processing (runs after bicycleParking.lua).
-- This file only orchestrates the includes.
--

-- CREATE CUSTOM FUNCTIONS
\i '/processing/topics/bicycleParking/custom_functions/split_area.sql'

-- 1. One geometry per part of a split object
\i '/processing/topics/bicycleParking/1_split_parts.sql'
-- 2. Parkings inside a mobility hub
\i '/processing/topics/bicycleParking/2_flag_mobility_hub.sql'

DO $$ BEGIN RAISE NOTICE 'FINISH topics/bicycleParking/bicycleParking.sql at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
