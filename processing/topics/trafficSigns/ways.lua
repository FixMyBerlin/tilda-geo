local ORIENTABLE_TRAFFIC_SIGN_NODES = require('topics.trafficSigns.helper.orientable_nodes')
local exit_processing_ways = require('topics.trafficSigns.helper.exit_processing_ways')

local direction_table = osm2pgsql.define_table({
  name = '_trafficSignDirections',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'node_id', type = 'bigint' },
    { column = 'idx', type = 'int' },
    { column = 'geom', type = 'linestring' },
  },
})

---@param object table
local function ways(object)
  if exit_processing_ways(object) then
    return
  end

  local prev_idx = nil
  local prev_was_sign = false
  local prev_node_id = nil
  local is_sign = false
  local line_geom = object:as_linestring()
  for idx, id in pairs(object.nodes) do
    is_sign = ORIENTABLE_TRAFFIC_SIGN_NODES.needs_orientation(id)
    if is_sign and prev_idx ~= nil then
      direction_table:insert({
        node_id = id,
        idx = prev_idx,
        geom = line_geom,
      })
    end
    if prev_was_sign then
      direction_table:insert({
        node_id = prev_node_id,
        idx = prev_idx,
        geom = line_geom,
      })
    end
    prev_idx = idx
    prev_node_id = id
    prev_was_sign = is_sign
  end
end

return ways
