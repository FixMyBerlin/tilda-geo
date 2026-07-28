local insert_topic_error_row = require('topics.helper.insert_topic_error_row')
local INSTRUCTIONS = require('topics.helper.topic_error_instructions')

-- Under busted, `require('topics.helper.osm2pgsql')` is the test mock (no `define_table`). This file is still loaded
-- (e.g. `bikelanes` → here), so we must skip `define_table` and export no-op loggers instead of erroring.
if type(osm2pgsql) ~= 'table' or osm2pgsql.define_table == nil then
  ---@class RoadsBikelanesErrors
  ---@field SANITIZED_VALUE fun(object_type: string, object_id: number|string, geom: table, tags: OsmTags|nil, caller_name: string)
  return {
    ---@param object_type string
    ---@param object_id number|string
    ---@param geom table
    ---@param tags OsmTags|nil
    ---@param caller_name string
    SANITIZED_VALUE = function(object_type, object_id, geom, tags, caller_name) end,
  }
end

---@type table
local db_table = osm2pgsql.define_table({
  name = 'roads_bikelanes_errors',
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

---@class RoadsBikelanesErrors
---@field SANITIZED_VALUE fun(object_type: string, object_id: number|string, geom: table, tags: OsmTags|nil, caller_name: string)
---@type RoadsBikelanesErrors
return {
  ---@param object_type string
  ---@param object_id number|string
  ---@param geom table
  ---@param tags OsmTags|nil
  ---@param caller_name string
  SANITIZED_VALUE = function(object_type, object_id, geom, tags, caller_name)
    insert_topic_error_row(
      db_table,
      object_type,
      object_id,
      geom,
      tags,
      caller_name,
      INSTRUCTIONS.SANITIZED_VALUE.key,
      INSTRUCTIONS.SANITIZED_VALUE.instruction
    )
  end,
}
