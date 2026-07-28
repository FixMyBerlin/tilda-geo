local log = require('topics.helper.log')
local merge_table = require('topics.helper.merge_table')
local LOG_ERROR = require('topics.parking.errors.parking_errors')
local separate_parking_point_categories = require('topics.parking.separate_parkings.point.separate_parking_point_categories')
local categorize_separate_parking = require('topics.parking.separate_parkings.helper.categorize_separate_parking')
local result_tags = require('topics.parking.separate_parkings.helper.result_tags')

local db_table = osm2pgsql.define_table({
  name = '_parking_separate_parking_points',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type', index='always' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'point', projection = 5243 },
  },
})

local function parking_separate_parking_points(object)
  if next(object.tags) == nil then return end

  local result = categorize_separate_parking(object, separate_parking_point_categories)
  if result.object then
    local row_data, replaced_tags = result_tags(result.category, result.object, nil)
    local row = merge_table({ geom = result.object:as_point() }, row_data)

    LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, replaced_tags, 'parking_separate_parking_points')
    db_table:insert(row)
  end
end

return parking_separate_parking_points
