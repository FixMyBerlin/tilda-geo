local SETS = require('topics.landcover.settlement_areas.helper.landuse_sets')

-- Source polygons for the settlement-area dissolve: a minimal, transient extract (geometry +
-- which tag family matched), read only by dissolve.sql. geom is stored in EPSG:5243 directly
-- (projection = 5243, like the parking topic), so dissolve.sql buffers in true ground meters.
-- See README.md for the input definition, method and CRS rationale.
local db_table = osm2pgsql.define_table({
  name = '_settlement_source_areas',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'category', type = 'text' },
    { column = 'geom', type = 'geometry', projection = 5243 },
  },
})

--- Area handler (same shape as barriers' barrier_areas): the entrypoint routes area-eligible
--- objects (closed ways, multipolygon relations) here. object:as_multipolygon() works for both.
---@param object table
local function settlement_source(object)
  local category = SETS.category(object.tags)
  if not category then
    return
  end
  db_table:insert({ category = category, geom = object:as_multipolygon() })
end

return settlement_source
