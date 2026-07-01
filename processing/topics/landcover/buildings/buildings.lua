-- Buildings source for the `_buildings` PROCESSING-ONLY table (geometry only — no tags/meta,
-- no minzoom). The leading `_` keeps it out of Martin's tile sources; it is for processing only.
-- The heavy import is fine on the weekend schedule. filter.sql drops buildings < 100 m².
--
-- TODO: when `_buildings` becomes a PRESENTATIONAL table, give it the standard topic shape
--       (id/tags/meta/geom + a minzoom), reinstate the display-oriented cluster-merge
--       (grid-partitioned, like the settlement dissolve), and drop the `_` prefix.
local db_table = osm2pgsql.define_table({
  name = '_buildings',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    -- 5243 (meters) like the rest of landcover, so the < 100 m² filter is a true area.
    { column = 'geom', type = 'multipolygon', projection = 5243 },
  },
  indexes = {
    { column = 'geom', method = 'gist' },
  },
})

--- Area handler: every building=* closed way / multipolygon relation (geometry only).
--- The entrypoint routes closed ways + multipolygon relations here.
---@param object table
local function buildings(object)
  if not object.tags.building then
    return
  end
  db_table:insert({ geom = object:as_multipolygon() })
end

return buildings
