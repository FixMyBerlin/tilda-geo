local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.bicycleParking.bicycleParking_errors')
local BICYCLE_RENTAL = require('topics.bicycleParking.helper.bicycle_rental')
local insert_bicycle_rental_point = require('topics.bicycleParking.helper.insert_bicycle_rental_point')

-- Nodes as they are; ways (stations mapped as an area or a line) and multipolygon relations as
-- their centroid.
local function process_bicycle_rental(object)
  if not BICYCLE_RENTAL.is_bicycle_rental(object.tags) then return end

  local geom
  if object.type == 'node' then
    geom = object:as_point()
  elseif object.type == 'relation' then
    geom = object:as_multipolygon():centroid()
  elseif object.is_closed then
    geom = object:as_polygon():centroid()
  else
    geom = object:as_linestring():centroid()
  end

  local cleaned_tags, replaced_tags = BICYCLE_RENTAL.result_tags(object.tags)
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'bicycleParking_rental')
  insert_bicycle_rental_point(cleaned_tags, metadata(object), geom, default_id(object))
end

return process_bicycle_rental
