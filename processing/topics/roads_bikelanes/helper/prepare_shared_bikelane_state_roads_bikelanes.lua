local bikelanes = require('topics.roads_bikelanes.bikelanes.extract_bikelanes')
local bikelanes_presence = require('topics.roads_bikelanes.bikelanes.bikelanes_presence')

---@param object_tags OsmTags
---@param object_geom table
---@return BikelaneState
local function prepare_shared_bikelane_state_roads_bikelanes(object_tags, object_geom)
  local cycleways = bikelanes(object_tags, object_geom)
  local cycleway_presence = bikelanes_presence(object_tags, cycleways)

  return {
    cycleways = cycleways,
    cycleway_presence = cycleway_presence,
  }
end

return prepare_shared_bikelane_state_roads_bikelanes
