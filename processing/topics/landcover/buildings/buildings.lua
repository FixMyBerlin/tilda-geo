-- Buildings source for the `_buildings` PROCESSING-ONLY table (geometry + a sanitized `category`,
-- no tags/meta, no minzoom). The leading `_` marks it internal: no map layer, Martin only serves
-- it for inspection; it is for processing only.
-- The heavy import is fine on the weekend schedule. filter.sql drops buildings < 100 m² (except
-- train stations).
--
-- `category` (only the values we use, NULL for every other building):
--   - `train_station`: `building=train_station`. The space-finder-worker scores proximity to the
--     station building for the ÖPNV factor; filter.sql keeps small ones.
--
-- TODO: when `_buildings` becomes a PRESENTATIONAL table, give it the standard topic shape
--       (id/tags/meta/geom + a minzoom), reinstate the display-oriented cluster-merge
--       (grid-partitioned, like the settlement dissolve), and drop the `_` prefix.
local db_table = osm2pgsql.define_table({
  name = '_buildings',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'category', type = 'text' },
    -- 5243 (meters) like the rest of landcover, so the < 100 m² filter is a true area.
    { column = 'geom', type = 'multipolygon', projection = 5243 },
  },
  indexes = {
    { column = 'geom', method = 'gist' },
  },
})

---@param tags OsmTags
---@return 'train_station'|nil
local function building_category(tags)
  if tags.building == 'train_station' then return 'train_station' end
  return nil
end

--- Area handler: every building=* closed way / multipolygon relation.
--- The entrypoint routes closed ways + multipolygon relations here.
---@param object table
local function buildings(object)
  if not object.tags.building then
    return
  end
  db_table:insert({
    category = building_category(object.tags),
    geom = object:as_multipolygon(),
  })
end

return buildings
