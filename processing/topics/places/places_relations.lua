require('init')
local metadata = require('metadata')
local default_id = require('default_id')
local LOG_ERROR = require('places_errors')
local places_tables = require('places_tables')
local exit_processing_places = require('exit_processing_places')
local result_tags_places = require('result_tags_places')

local table = places_tables.table

local function places_relations(object)
  if exit_processing_places(object) then return end
  if object.tags.type ~= 'multipolygon' then return end

  local cleaned_tags, replaced_tags = result_tags_places(object.tags)
  local geom = object:as_multipolygon():pole_of_inaccessibility()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'places_relation')

  table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = 0,
    id = default_id(object)
  })
end

return places_relations
