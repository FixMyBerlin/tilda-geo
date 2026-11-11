local SET = require('topics.helper.sets')
local ONEWAY_VALUES = require('topics.roads_bikelanes.bikelanes.helper.oneway_values')

-- A road whose traffic flows in one direction: `oneway=yes|1|-1` or a roundabout,
-- which implies `oneway=yes`. https://wiki.openstreetmap.org/wiki/Key:oneway
local ONEWAY_JUNCTIONS = SET.set({ 'roundabout', 'circular' })

---@param road_tags OsmTags tags of the road centerline
---@return boolean
local function is_oneway_road(road_tags)
  return ONEWAY_VALUES[road_tags.oneway] == true or ONEWAY_JUNCTIONS[road_tags.junction] == true
end

return is_oneway_road
