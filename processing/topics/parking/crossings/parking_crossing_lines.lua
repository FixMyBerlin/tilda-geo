require('init')
require('Log')
require('MergeTable')
local categorize_crossing_line = require('categorize_crossing_line')
require('sanitize_cleaner')
require('parking_errors')
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

local function parking_crossing_lines(object)
  if object.is_closed then return end
  if next(object.tags) == nil then return end

  local result = categorize_crossing_line(object)
  if result.object then

    local row_tags = result_tags_crossings(result)
    local cleaned_tags, replaced_tags = sanitize_cleaner(row_tags.tags, result.object.tags)
    row_tags.tags = cleaned_tags
    parking_errors(result.object, replaced_tags, 'parking_crossing_lines')

    local row = MergeTable({ geom = result.object:as_linestring() }, row_tags)
    db_table:insert(row)
  end
end

return parking_crossing_lines
