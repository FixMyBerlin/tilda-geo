require('init')
require('Log')
require('MergeTable')
require('categorize_line')
local sanitize_cleaner = require('sanitize_cleaner')
local LOG_ERROR = require('parking_errors')
local result_tags_obstacles = require('result_tags_obstacles')

local db_table = osm2pgsql.define_table({
  name = '_parking_obstacle_lines',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'linestring', projection = 5243 },
  },
})

local function parking_obstacle_lines(object)
  if object.is_closed then return end
  if next(object.tags) == nil then return end

  local result = categorize_line(object)
  if result.object then
    local row_data = result_tags_obstacles(result)
    local cleaned_tags, replaced_tags = sanitize_cleaner(row_data.tags, result.object.tags)
    row_data.tags = cleaned_tags
    local row = MergeTable({ geom = result.object:as_linestring() }, row_data)

    LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, replaced_tags, 'parking_obstacle_lines')
    db_table:insert(row)
  end
end

return parking_obstacle_lines
