require('init')
local metadata = require('metadata')
local default_id = require('default_id')
local LOG_ERROR = require('trafficSigns_errors')
local ORIENTABLE_TRAFFIC_SIGN_NODES = require('orientable_traffic_sign_nodes')
local exit_processing_traffic_sign_nodes = require('exit_processing_traffic_sign_nodes')
local split_traffic_sign_directions = require('split_traffic_sign_directions')
local cardinal_direction_to_degree = require('cardinal_direction_to_degree')
local result_tags_traffic_signs = require('result_tags_traffic_signs')

local db_table = osm2pgsql.define_table({
  name = 'trafficSigns',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id', type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id', method = 'btree', unique = true },
  },
})

---@param object table
local function traffic_signs_nodes(object)
  if exit_processing_traffic_sign_nodes(object) then
    return
  end

  local tags = object.tags
  tags.direction = tags.direction or tags['traffic_sign:direction']
  local direction
  local direction_source = nil
  if tags.direction ~= nil then
    direction = tonumber(tags.direction)
    direction_source = 'tag_degrees'
    if direction == nil then
      direction = cardinal_direction_to_degree(tags.direction)
      direction_source = 'tag_cardinal'
    end
    if direction == nil then
      ORIENTABLE_TRAFFIC_SIGN_NODES.mark_for_orientation(object.id)
    end
  end
  for i, traffic_sign in pairs(split_traffic_sign_directions(tags)) do
    local cleaned_tags, replaced_tags = result_tags_traffic_signs(tags, traffic_sign, tonumber(direction), direction_source)
    local point_geom = object:as_point()
    LOG_ERROR.SANITIZED_VALUE(object, point_geom, replaced_tags, 'trafficSigns_node')
    if cleaned_tags.traffic_sign == nil then
      goto continue
    end
    db_table:insert({
      tags = cleaned_tags,
      meta = metadata(object),
      geom = point_geom,
      minzoom = 0,
      id = default_id(object) .. '/' .. i,
    })
    ::continue::
  end
end

return traffic_signs_nodes
