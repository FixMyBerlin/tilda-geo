-- A road whose traffic flows in one direction. Expects tags after `normalize_oneway_tags`,
-- which also sets `oneway=yes` on roundabouts. https://wiki.openstreetmap.org/wiki/Key:oneway
---@param road_tags OsmTags tags of the road centerline
---@return boolean
local function is_oneway_road(road_tags)
  return road_tags.oneway == 'yes' or road_tags.oneway == '-1'
end

return is_oneway_road
