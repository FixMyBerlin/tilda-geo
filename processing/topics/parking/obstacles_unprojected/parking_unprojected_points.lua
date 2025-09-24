require('init')
require('Log')
require('MergeTable')
local categorize_unprojected_points = require('categorize_unprojected_points')
local LOG_ERROR = require('parking_errors')
local result_tags_obstacles = require('result_tags_obstacles')

local db_table = osm2pgsql.define_table({
  name = '_parking_turnaround_points',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type', index='always' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'point', projection = 5243 },
  },
})

local function parking_turnaround_points(object)
  if next(object.tags) == nil then return end

  local result = categorize_unprojected_points(object)
  if result.object then
    local row_data, replaced_tags = result_tags_obstacles(result)
    local row = MergeTable({ geom = result.object:as_point() }, row_data)

    LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, replaced_tags, 'parking_turnaround_points')
    db_table:insert(row)
  end
end

return parking_turnaround_points
