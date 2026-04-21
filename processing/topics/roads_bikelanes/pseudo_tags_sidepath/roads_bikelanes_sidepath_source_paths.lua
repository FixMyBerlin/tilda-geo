require('init')
require('HighwayClasses')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_CLEANER = require('sanitize_cleaner')

local db_table = osm2pgsql.define_table({
  name = '_roads_bikelanes_sidepath_source_paths',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'layer', type = 'text' },
    { column = 'geom', type = 'linestring' },
  },
})

--- Writes minimal sidepath source rows used by sidepath estimation export.
--- @param object table
--- @param object_tags table
local function roads_bikelanes_sidepath_source_paths(object, object_tags)
  if not sidepath_highway_classes[object_tags.highway] then
    return
  end

  local row = {
    layer = SANITIZE_CLEANER.remove_disallowed_value(SANITIZE_TAGS.safe_string(object_tags.layer)),
    geom = object:as_linestring(),
  }

  db_table:insert(row)
end

return roads_bikelanes_sidepath_source_paths
