-- Train station buildings for the `_buildings_train_station` PROCESSING-ONLY table
-- (geometry only — no tags/meta, no minzoom). The leading `_` keeps it out of Martin's tile
-- sources; it is used by the planning-worker to score proximity to train stations for the
-- ÖPNV factor (bicycle parking is best planned as close as possible to the station building).
--
-- Separate from `_buildings` on purpose: that table drops rows with no tag column at all
-- (see buildings.lua) and additionally filters out buildings < 100 m² (filter.sql) — a
-- filter station buildings should not be subject to.
--
-- TODO: if this ever becomes a PRESENTATIONAL table, give it the standard topic shape
--       (id/tags/meta/geom + a minzoom) and drop the `_` prefix.
local db_table = osm2pgsql.define_table({
  name = '_buildings_train_station',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    -- 5243 (meters) like `_buildings`, so downstream distance math stays in a metric CRS.
    { column = 'geom', type = 'multipolygon', projection = 5243 },
  },
  indexes = {
    { column = 'geom', method = 'gist' },
  },
})

--- Area handler: every building=train_station closed way / multipolygon relation.
---@param object table
local function buildings_train_station(object)
  if object.tags.building ~= 'train_station' then
    return
  end
  db_table:insert({ geom = object:as_multipolygon() })
end

return buildings_train_station
