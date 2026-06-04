require('init')
require('DefaultId')

local db_table_error = osm2pgsql.define_table({
  name = 'width_errors',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'serial_id', sql_type = 'serial', create_only = true },
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'linestring' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = {'minzoom', 'geom'}, method = 'gist' },
    { column = 'serial_id', method = 'btree', unique = true  },
    { column = 'id', method = 'btree', unique = false  },
  }
})

local function log_width_error(object, tag_name, invalid_value, error_msg)
  if not object then return end

  local geom = nil
  if object.as_linestring then
    pcall(function() geom = object:as_linestring() end)
  end

  local tags = {
    osm_id = tostring(object.id),
    osm_type = object.type,
    tag = tag_name or "width",
    value = tostring(invalid_value),
    error = error_msg or "Invalid width format"
  }

  local row = {
    id = DefaultId(object),
    geom = geom,
    tags = tags,
    meta = {},
    minzoom = 0
  }
  db_table_error:insert(row)
end

return {
  log = log_width_error,
  table = db_table_error
}
