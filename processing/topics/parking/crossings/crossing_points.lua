local log = require('topics.helper.log')
local merge_table = require('topics.helper.merge_table')
local categorize_and_transform_crossing_points = require('topics.parking.crossings.points.categorize_and_transform_crossing_points')
local LOG_ERROR = require('topics.parking.errors.parking_errors')
local result_tags = require('topics.parking.crossings.helper.result_tags')

local db_table = osm2pgsql.define_table({
  name = '_parking_crossing_points',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type', index='always' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'point', projection = 5243 },
  },
})

local function crossing_points(object)
  if next(object.tags) == nil then return end

  local self_left_right, direction_replaced = categorize_and_transform_crossing_points(object)
  for _, result in pairs(self_left_right) do
    if result.object then
      local row_data, replaced_tags = result_tags(result)
      local merged_replaced = merge_table({}, direction_replaced)
      merge_table(merged_replaced, replaced_tags)
      local row = merge_table({ geom = result.object:as_point() }, row_data)

      LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, merged_replaced, 'parking_crossing_points')
      db_table:insert(row)
    end
  end
end

return crossing_points
