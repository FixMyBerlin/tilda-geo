-- Open ways with more than one part: the line the split is cut from. Internal (`_` prefix), only read by bicycleParking.sql.
local line_table = osm2pgsql.define_table({
  name = '_bicycleParking_lines',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id', type = 'text', not_null = true },
    { column = 'geom', type = 'linestring' },
  },
  indexes = {
    { column = 'geom', method = 'gist' },
  },
})

---@param id string
---@param geom any
local function insert_bicycle_parking_line(id, geom)
  line_table:insert({
    id = id,
    geom = geom,
  })
end

return insert_bicycle_parking_line
