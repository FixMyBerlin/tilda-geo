require('init')
local metadata = require('metadata')
local default_id = require('default_id')
local LOG_ERROR = require('publicTransport_errors')
local public_transport_tables = require('public_transport_tables')
local exit_processing_public_transport = require('exit_processing_public_transport')
local result_tags_public_transport = require('result_tags_public_transport')

local table = public_transport_tables.table

local function public_transport_ways(object)
  if exit_processing_public_transport(object) then return end
  if not object.is_closed then return end
  local cleaned_tags, replaced_tags = result_tags_public_transport(object.tags)
  local geom = object:as_polygon():pole_of_inaccessibility()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'publicTransport_way')

  table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = 0,
    id = default_id(object)
  })
end

return public_transport_ways
