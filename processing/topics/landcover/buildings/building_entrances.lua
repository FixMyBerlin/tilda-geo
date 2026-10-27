-- Entrance nodes for the `buildingEntrances` table (standard topic shape: id/tags/meta/geom +
-- minzoom). It is the map layer "Gebäudeeingänge" and also read by the planning-worker
-- (`PostgisLoader.load_building_entrances`), which can let demand originate at the building
-- entrance instead of the building outline.
--
-- We do NOT verify that the node actually sits on a building: `entrance=*` is virtually always
-- mapped as a vertex of a building outline, and proving it (osm2pgsql 2.3 id cache, or a spatial
-- join against `_buildings`) buys accuracy this use case does not need. Entrances on fences or
-- barriers are imported too.
--
-- Every `entrance` value is imported, not just yes/main: filtering downstream is free, while a
-- re-import costs a full weekend run.
local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.landcover.buildings.building_entrances_errors')
local result_tags_building_entrances = require('topics.landcover.buildings.helper.result_tags_building_entrances')

-- Must not exceed SIMPLIFY_MAX_ZOOM (14): sources stop requesting tiles there and overzoom, and
-- the tile function drops rows with `z < minzoom`. The style layer hides entrances below z16.
local MINZOOM = 14

local db_table = osm2pgsql.define_table({
  name = 'buildingEntrances',
  ids = { type = 'node', id_column = 'osm_id' },
  columns = {
    { column = 'id', type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id', method = 'btree', unique = true },
  },
})

---@param object OsmObject
---@return boolean
local function exit_processing_building_entrances(object)
  -- Subway entrances are often also tagged `entrance=yes`; they belong to the publicTransport
  -- topic (`_publicTransport_entrances`), not to the building entrances layer.
  if object.tags.railway == 'subway_entrance' then return true end
  return not object.tags.entrance
end

--- Node handler: every entrance=* node except subway entrances.
---@param object OsmObject
local function building_entrances(object)
  if exit_processing_building_entrances(object) then
    return
  end

  local cleaned_tags, replaced_tags = result_tags_building_entrances(object.tags)
  local geom = object:as_point()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'building_entrances')

  db_table:insert({
    id = default_id(object),
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = MINZOOM,
  })
end

return building_entrances
