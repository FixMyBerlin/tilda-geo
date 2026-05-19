local insert_topic_error_row = require('topics.helper.insert_topic_error_row')
local INSTRUCTIONS = require('topics.helper.topic_error_instructions')

-- Under busted, `require('topics.helper.osm2pgsql')` is the test mock (no `define_table`). This file is still loaded
-- by parking topics, so we must skip `define_table` and export no-op loggers instead of erroring.
if type(osm2pgsql) ~= 'table' or osm2pgsql.define_table == nil then
  return {
    SANITIZED_VALUE = function() end,
    RELATION = function() end,
  }
end

local db_table = osm2pgsql.define_table({
  name = 'parking_errors',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    -- We cannot use our own id system here because the uniquess index fails.
    -- This is our solution: https://osm2pgsql.org/doc/manual-v1.html#using-an-additional-id-column
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

-- Called right before other tables are inserted.
-- Handles point, line and area data but stores them as points (centroid)
-- `tags` are based on sanitize_for_logging.lua and sanitize_cleaner.lua
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
  RELATION = function(object, geom, caller_name)
    insert_topic_error_row(
      db_table,
      object.type,
      object.id,
      geom,
      {},
      caller_name,
      INSTRUCTIONS.RELATION.key,
      INSTRUCTIONS.RELATION.instruction
    )
  end,
}
