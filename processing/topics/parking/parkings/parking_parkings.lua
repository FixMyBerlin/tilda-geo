local log = require('topics.helper.log')
local result_tags = require('topics.parking.parkings.helper.result_tags')
local has_parking = require('topics.parking.parkings.helper.has_parking')
local transform_parkings = require('topics.parking.parkings.helper.transform_parkings')
local LOG_ERROR = require('topics.parking.errors.parking_errors')

local db_table = osm2pgsql.define_table({
  name = '_parking_road_parkings',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'side',    type = 'text' },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb', not_null = true },
  },
  indexes = {
    { column = { 'osm_id', 'side' }, method = 'btree' },
  }
})

function parking_parkings(object)
  if not has_parking(object.tags) then return end

  local transformed_objects = transform_parkings(object)
  -- One error row per way: `parking:both:*` would otherwise be logged for each side
  local replaced_tags_all_sides = {}
  for _, transformed_object in pairs(transformed_objects) do
    local row_data, replaced_tags = result_tags(transformed_object)
    for key, value in pairs(replaced_tags) do
      replaced_tags_all_sides[key] = value
    end

    -- Note: No geometry for this table
    db_table:insert(row_data)
  end

  if next(replaced_tags_all_sides) ~= nil then
    LOG_ERROR.SANITIZED_VALUE(object, object:as_linestring(), replaced_tags_all_sides, 'parking_parkings')
  end
end

return parking_parkings
