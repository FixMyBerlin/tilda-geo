/* sql-formatter-disable */
-- WHAT IT DOES:
-- Write `tags.route_relations` on every way in `roads`, `roadsPathClasses` and `bikelanes` that
-- is a member of a route relation (types in topics/helper/route_types.lua). Pseudo relations
-- from external data are already set by Lua and kept at the end.
-- Format: `<route>:<relation id>,<relation id>;<route>:<relation id>`, e.g.
--   bicycle:2788485,12138805;bus:1234567
-- Routes sorted by name, ids ascending. Format: topic-docs/roads_bikelanes/chapters/routen.md
--
-- INPUT: `_routeRelationMembers` (relation_id, way_id, route), written by process_relation
-- Runs once per import: osm2pgsql recreates the tables, a second run would repeat the OSM groups.
DO $$ BEGIN RAISE NOTICE 'START route_relations at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

CREATE TEMP TABLE _route_relations_by_way AS
WITH per_route AS (
  -- route_relation_members.lua writes each (way, relation) pair once.
  SELECT way_id, route, string_agg(relation_id::text, ',' ORDER BY relation_id) AS ids
  FROM public."_routeRelationMembers"
  GROUP BY way_id, route
)
SELECT way_id, string_agg(route || ':' || ids, ';' ORDER BY route) AS route_relations
FROM per_route
GROUP BY way_id;

ANALYZE _route_relations_by_way;

UPDATE public.roads t
-- Lua already wrote pseudo relations (e.g. `radnetz_berlin:…`); they sort after the OSM routes.
SET tags = COALESCE(t.tags, '{}'::jsonb)
  || jsonb_build_object('route_relations', concat_ws(';', r.route_relations, t.tags->>'route_relations'))
FROM _route_relations_by_way r
WHERE t.osm_type = 'W' AND t.osm_id = r.way_id;

UPDATE public."roadsPathClasses" t
SET tags = COALESCE(t.tags, '{}'::jsonb)
  || jsonb_build_object('route_relations', concat_ws(';', r.route_relations, t.tags->>'route_relations'))
FROM _route_relations_by_way r
WHERE t.osm_type = 'W' AND t.osm_id = r.way_id;

UPDATE public.bikelanes t
SET tags = COALESCE(t.tags, '{}'::jsonb)
  || jsonb_build_object('route_relations', concat_ws(';', r.route_relations, t.tags->>'route_relations'))
FROM _route_relations_by_way r
WHERE t.osm_type = 'W' AND t.osm_id = r.way_id;

DROP TABLE _route_relations_by_way;

DO $$ BEGIN RAISE NOTICE 'END route_relations at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
