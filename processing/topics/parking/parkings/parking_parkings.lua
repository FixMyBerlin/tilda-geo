require('init')
require('Log')
require('MergeTable')
local result_tags_parkings = require('result_tags_parkings')
local has_parking = require('has_parking')
local transform_parkings = require('transform_parkings')

local db_table = osm2pgsql.define_table({
  name = '_parking_road_parkings',
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
    local row_data = result_tags_parkings(transformed_object)

    -- Note: No geometry for this table
    db_table:insert(row_data)
  end
end
