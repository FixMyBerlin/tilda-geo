local log = require('topics.helper.log')
local result_tags = require('topics.parking.parkings.helper.result_tags')
local has_parking = require('topics.parking.parkings.helper.has_parking')
local transform_parkings = require('topics.parking.parkings.helper.transform_parkings')

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
    local row_data = result_tags(transformed_object)

    -- Note: No geometry for this table
    db_table:insert(row_data)
  end
end

return parking_parkings
