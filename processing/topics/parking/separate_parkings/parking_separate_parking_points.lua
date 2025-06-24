require('init')
require('Log')
require('MergeTable')
local sanitize_cleaner = require('sanitize_cleaner')
require('parking_errors')
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
    local row_tags = result_tags_separate_parking(result, nil)
    local cleaned_tags, replaced_tags = sanitize_cleaner(row_tags.tags, result.object.tags)
    row_tags.tags = cleaned_tags
    parking_errors(result.object, replaced_tags, 'parking_separate_parking_points')

    local row = MergeTable({ geom = result.object:as_point() }, row_tags)
    db_table:insert(row)
  end
end

return parking_separate_parking_points
