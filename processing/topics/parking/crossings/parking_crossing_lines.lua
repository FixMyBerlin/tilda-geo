require('init')
require('Log')
require('MergeTable')
local categorize_crossing_line = require('categorize_crossing_line')
local LOG_ERROR = require('parking_errors')
local result_tags_crossings = require('result_tags_crossings')

local db_table = osm2pgsql.define_table({
  name = '_parking_crossing_lines',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type', index='always' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'linestring', projection = 5243 },
  },
})

local ncm = osm2pgsql.define_table({
  name = '_parking_node_crossing_mapping',
  ids = { type = 'way', id_column = 'way_id',  index='always' },
  columns = {
    { column = 'node_id',      type = 'bigint',      not_null = true },
  },
  indexes = {
    { column = 'node_id', method = 'btree'},
    { column = 'way_id', method = 'btree'},
  }
})

-- NOTE: This is unused ATM.
-- See https://github.com/FixMyBerlin/private-issues/issues/2557 for more.
-- We leave it in because it is fast and it's easier to evaluate the linked issue based on the data.
-- TOOD: Once used, remove the "UNUSED_" from the category ID.
--
local function parking_crossing_lines(object)
  if object.is_closed then return end
  if next(object.tags) == nil then return end

  local result = categorize_crossing_line(object)
  if result.object then
    local row_data, replaced_tags = result_tags_crossings(result)
    local row = MergeTable({ geom = result.object:as_linestring() }, row_data)

    LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, replaced_tags, 'parking_crossing_lines')
    db_table:insert(row)

    for _, node_id in ipairs(object.nodes) do
      ncm:insert({node_id = node_id})
    end
  end
end

return parking_crossing_lines
