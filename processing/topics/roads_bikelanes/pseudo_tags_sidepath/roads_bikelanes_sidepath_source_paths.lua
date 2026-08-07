local HIGHWAY_CLASSES = require('topics.helper.highway_classes')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local SANITIZE_CLEANER = require('topics.helper.sanitize_cleaner')
local bikelane_categories = require('topics.roads_bikelanes.bikelanes.bikelane_categories')
local path_is_crossing = require('topics.roads_bikelanes.pseudo_tags_sidepath.path_is_crossing')

local db_table = osm2pgsql.define_table({
  name = '_roads_bikelanes_sidepath_source_paths',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'layer', type = 'text' },
    { column = 'is_crossing', type = 'bool' },
    { column = 'geom', type = 'linestring' },
  },
})

--- Writes minimal sidepath source rows used by sidepath estimation export.
--- KEEP IN SYNC — path scope matches topics/helper/highway_classes.lua `sidepath_highway_classes`,
--- minus Fahrradstraße / Fußgängerzone-Rad-frei (`is_own_cycling_facility`).
--- Crossings: `path_is_crossing` (roads.road crossing classes).
---@param object_tags OsmTags
---@param object_geom OsmGeometry
local function roads_bikelanes_sidepath_source_paths(object_tags, object_geom)
  if not HIGHWAY_CLASSES.sidepath_highway_classes[object_tags.highway] then
    return
  end
  if bikelane_categories.is_own_cycling_facility(object_tags) then
    return
  end

  db_table:insert({
    layer = SANITIZE_CLEANER.remove_disallowed_value(SANITIZE_TAGS.safe_string(object_tags.layer)),
    is_crossing = path_is_crossing(object_tags),
    geom = object_geom,
  })
end

return roads_bikelanes_sidepath_source_paths
