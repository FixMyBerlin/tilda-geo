local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.places.places_errors')
local places_tables = require('topics.places.places_tables')
local exit_processing = require('topics.places.helper.exit_processing')
local result_tags = require('topics.places.helper.result_tags')
local minzoom = require('topics.places.helper.minzoom')

local table = places_tables.table

local function places_nodes(object)
  if exit_processing(object) then return end

  local cleaned_tags, replaced_tags = result_tags(object.tags)
  local geom = object:as_point()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'places_node')

  table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = minzoom(cleaned_tags),
    id = default_id(object),
  })
end

return places_nodes
