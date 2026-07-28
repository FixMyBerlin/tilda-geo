local log = require('topics.helper.log')
local merge_table = require('topics.helper.merge_table')
local categorize_line = require('topics.parking.obstacles.line.categorize_line')
local LOG_ERROR = require('topics.parking.errors.parking_errors')
local result_tags = require('topics.parking.obstacles.helper.result_tags')

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

local function obstacle_lines(object)
  if object.is_closed then return end
  if next(object.tags) == nil then return end

  local result = categorize_line(object)
  if result.object then
    local row_data, replaced_tags = result_tags(result)
    local row = merge_table({ geom = result.object:as_linestring() }, row_data)

    LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, replaced_tags, 'parking_obstacle_lines')
    db_table:insert(row)
  end
end

return obstacle_lines
