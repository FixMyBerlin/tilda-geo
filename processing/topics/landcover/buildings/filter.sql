-- WHAT IT DOES:
-- Drop small buildings (< 100 m²) from `_buildings`, except train station buildings
-- (`category = 'train_station'`): small station buildings are ÖPNV score targets of the space-finder-worker.
-- INPUT: `public._buildings` (polygon, from buildings.lua)
-- OUTPUT: `public._buildings` (filtered in place)
--
-- _buildings is a processing-only table — the `_` prefix keeps it out of Martin's display layers,
-- and it has no minzoom. Buildings are NOT cluster-merged: clustering (ST_ClusterIntersecting) is
-- only useful for display and is memory-heavy, so we skip it while this is processing-only.
-- TODO: when `_buildings` becomes presentational, add the standard shape + a minzoom and the
--       (grid-partitioned) cluster-merge, then drop the `_` prefix.
--
DO $$ BEGIN RAISE NOTICE 'START filtering buildings at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DELETE FROM public._buildings
WHERE
  ST_Area (geom) < 100 -- drop buildings < 100 m²
  AND category IS DISTINCT FROM 'train_station';

DO $$ BEGIN RAISE NOTICE 'END filtering buildings at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
