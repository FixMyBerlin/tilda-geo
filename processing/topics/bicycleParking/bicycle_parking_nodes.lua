require('init')
local metadata = require('metadata')
local default_id = require('default_id')
local LOG_ERROR = require('bicycleParking_errors')
local result_tags_bicycle_parking = require('result_tags_bicycle_parking')
local insert_bicycle_parking_point = require('insert_bicycle_parking_point')

local function process_node(object)
  if object.tags.amenity ~= 'bicycle_parking' then return end

  local cleaned_tags, replaced_tags = result_tags_bicycle_parking(object.tags)
  local geom = object:as_point()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'bicycleParking_node')

  insert_bicycle_parking_point(cleaned_tags, metadata(object), geom, default_id(object))
end

return process_node
