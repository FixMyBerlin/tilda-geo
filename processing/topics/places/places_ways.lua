local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.places.places_errors')
local places_tables = require('topics.places.places_tables')
local exit_processing = require('topics.places.helper.exit_processing')
local result_tags = require('topics.places.helper.result_tags')

local table = places_tables.table

local function places_ways(object)
  if exit_processing(object) then return end
  if not object.is_closed then return end
  local cleaned_tags, replaced_tags = result_tags(object.tags)
  local geom = object:as_polygon():pole_of_inaccessibility()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'places_way')

  table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = 0,
    id = default_id(object)
  })
end

return places_ways
