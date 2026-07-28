local HIGHWAY_CLASSES = require('topics.helper.highway_classes')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local SANITIZE_CLEANER = require('topics.helper.sanitize_cleaner')

local db_table = osm2pgsql.define_table({
  name = '_roads_bikelanes_sidepath_source_paths',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'layer', type = 'text' },
    { column = 'geom', type = 'linestring' },
  },
})

--- Writes minimal sidepath source rows used by sidepath estimation export.
---@param object_tags OsmTags
---@param object_geom table
local function roads_bikelanes_sidepath_source_paths(object_tags, object_geom)
  if not HIGHWAY_CLASSES.sidepath_highway_classes[object_tags.highway] then
    return
  end

  local row = {
    layer = SANITIZE_CLEANER.remove_disallowed_value(SANITIZE_TAGS.safe_string(object_tags.layer)),
    geom = object_geom,
  }

  db_table:insert(row)
end

return roads_bikelanes_sidepath_source_paths
