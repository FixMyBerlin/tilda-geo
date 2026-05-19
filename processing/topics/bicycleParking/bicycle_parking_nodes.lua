local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.bicycleParking.bicycleParking_errors')
local result_tags = require('topics.bicycleParking.helper.result_tags')
local insert_bicycle_parking_point = require('topics.bicycleParking.helper.insert_bicycle_parking_point')

local function process_node(object)
  if object.tags.amenity ~= 'bicycle_parking' then return end

  local cleaned_tags, replaced_tags = result_tags(object.tags)
  local geom = object:as_point()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'bicycleParking_node')

  insert_bicycle_parking_point(cleaned_tags, metadata(object), geom, default_id(object))
end

return process_node
