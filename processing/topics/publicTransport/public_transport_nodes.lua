local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.publicTransport.publicTransport_errors')
local public_transport_tables = require('topics.publicTransport.public_transport_tables')
local exit_processing = require('topics.publicTransport.helper.exit_processing')
local result_tags = require('topics.publicTransport.helper.result_tags')
local minzoom = require('topics.publicTransport.helper.minzoom')
local public_transport_entrances = require('topics.publicTransport.public_transport_entrances')

local table = public_transport_tables.table

local function public_transport_nodes(object)
  if object.tags.railway == 'subway_entrance' then
    public_transport_entrances(object)
    return
  end
  if exit_processing(object) then return end
  local cleaned_tags, replaced_tags = result_tags(object.tags)
  local geom = object:as_point()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'publicTransport_node')

  table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = minzoom(cleaned_tags),
    id = default_id(object),
  })
end

return public_transport_nodes
