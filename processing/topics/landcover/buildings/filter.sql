-- _buildings: drop small buildings (< 100 m²). Run from landcover.sql.
-- buildings.lua imports every building geometry (5243, GIST-indexed); here we only filter.
--
-- _buildings is a processing-only table — the `_` prefix keeps it out of Martin's display layers,
-- and it has no minzoom. Buildings are NOT cluster-merged: clustering (ST_ClusterIntersecting) is
-- only useful for display and is memory-heavy, so we skip it while this is processing-only.
-- TODO: when `_buildings` becomes presentational, add the standard shape + a minzoom and the
--       (grid-partitioned) cluster-merge, then drop the `_` prefix.
DELETE FROM public._buildings WHERE ST_Area (geom) < 100; -- drop buildings < 100 m²
