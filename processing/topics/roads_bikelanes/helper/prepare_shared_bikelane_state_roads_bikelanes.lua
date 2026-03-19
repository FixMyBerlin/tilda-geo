require('init')
local bikelanes = require('extract_bikelanes')
local bikelanes_presence = require('bikelanes_presence')

local function prepare_shared_bikelane_state_roads_bikelanes(object_tags, object_geom)
  local cycleways = bikelanes(object_tags, object_geom)
  local cycleway_presence = bikelanes_presence(object_tags, cycleways)

  return {
    cycleways = cycleways,
    cycleway_presence = cycleway_presence,
  }
end

return prepare_shared_bikelane_state_roads_bikelanes
