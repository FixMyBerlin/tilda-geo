require('init')
local insert_topic_error_row = require('insert_topic_error_row')
local INSTRUCTIONS = require('topic_error_instructions')

if type(osm2pgsql) ~= 'table' or osm2pgsql.define_table == nil then
  return {
    SANITIZED_VALUE = function() end,
  }
end

local db_table = osm2pgsql.define_table({
  name = 'publicTransport_errors',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'serial_id', sql_type = 'serial', create_only = true },
    { column = 'id', type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'serial_id', method = 'btree', unique = true },
    { column = 'id', method = 'btree', unique = false },
  },
})

return {
  SANITIZED_VALUE = function(object, geom, tags, caller_name)
    insert_topic_error_row(
      db_table,
      object.type,
      object.id,
      geom,
      tags,
      caller_name,
      INSTRUCTIONS.SANITIZED_VALUE.key,
      INSTRUCTIONS.SANITIZED_VALUE.instruction
    )
  end,
}
