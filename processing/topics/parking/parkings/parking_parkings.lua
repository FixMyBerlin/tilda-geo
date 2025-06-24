require('init')
require('Log')
require('MergeTable')
require('result_tags_parkings')
local has_parking = require('has_parking')
local sanitize_cleaner = require('sanitize_cleaner')
require('transform_parkings')

local db_table = osm2pgsql.define_table({
  name = '_parking_parkings1_road',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'side',    type = 'text' },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
  },
  indexes = {
    { column = { 'osm_id', 'side' }, method = 'btree' },
  }
})

function parking_parkings(object)
  if not has_parking(object.tags) then return end

  local transformed_objects = transform_parkings(object)
  for _, transformed_object in pairs(transformed_objects) do

    local row_tags = result_tags_parkings(transformed_object)
    local cleaned_tags, replaced_tags = sanitize_cleaner(row_tags.tags, transformed_object.tags)
    row_tags.tags = cleaned_tags
    parking_errors(transformed_object, replaced_tags, 'parking_parkings1_road')

    -- Note: No geometry for this table
    db_table:insert(row_tags)
  end
end
