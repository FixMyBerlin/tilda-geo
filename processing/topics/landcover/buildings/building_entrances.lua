-- Entrance nodes for the `_building_entrances` PROCESSING-ONLY table (point geometry + the raw
-- `entrance` value — no meta, no minzoom). The leading `_` keeps it out of Martin's tile sources;
-- the planning-worker uses it to let demand originate at the building entrance instead of the
-- building outline/centroid.
--
-- We do NOT verify that the node actually sits on a building: `entrance=*` is virtually always
-- mapped as a vertex of a building outline, and proving it (osm2pgsql 2.3 id cache, or a spatial
-- join against `_buildings`) buys accuracy this use case does not need. Entrances on fences or
-- barriers are imported too.
--
-- Every `entrance` value is imported, not just yes/main, with the value kept in a column:
-- filtering downstream is free, while a re-import costs a full weekend run.
--
-- TODO: if this ever becomes a PRESENTATIONAL table, give it the standard topic shape
--       (id/tags/meta/geom + a minzoom) and drop the `_` prefix.
local db_table = osm2pgsql.define_table({
  name = '_building_entrances',
  ids = { type = 'node', id_column = 'osm_id' },
  columns = {
    { column = 'entrance', type = 'text', not_null = true },
    -- 5243 (meters) like `_buildings`, so downstream distance math stays in a metric CRS.
    { column = 'geom', type = 'point', projection = 5243 },
  },
  indexes = {
    { column = 'geom', method = 'gist' },
  },
})

--- Node handler: every entrance=* node.
---@param object table
local function building_entrances(object)
  local entrance = object.tags.entrance
  if not entrance then
    return
  end
  db_table:insert({ entrance = entrance, geom = object:as_point() })
end

return building_entrances
