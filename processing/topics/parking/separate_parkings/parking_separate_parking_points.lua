require('init')
require('Log')
require('MergeTable')
local sanitize_cleaner = require('sanitize_cleaner')
local LOG_ERROR = require('parking_errors')
local separate_parking_point_categories = require('separate_parking_point_categories')
local categorize_separate_parking = require('categorize_separate_parking')
local result_tags_separate_parking = require('result_tags_separate_parking')

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
    local row_data = result_tags_separate_parking(result, nil)
    local row = MergeTable({ geom = result.object:as_point() }, row_data)
    local cleaned_tags, replaced_tags = sanitize_cleaner(row_data.tags, result.object.tags)
    row_data.tags = cleaned_tags

    LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, replaced_tags, 'parking_separate_parking_points')
    db_table:insert(row)
  end
end

return parking_separate_parking_points
