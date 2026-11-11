-- `mapillary_coverage` is a pseudo tag of the road. Lanes and tracks tagged on the road
-- (`cycleway:left|right|both`) are transformed objects without pseudo tags of their own,
-- so the road's coverage applies to them.
---@param object_tags OsmTags tags of a way or a transformed object with `_parent`
---@return boolean
local function has_mapillary_coverage(object_tags)
  local parent = object_tags._parent or {}
  return (object_tags.mapillary_coverage or parent.mapillary_coverage) ~= nil
end

return has_mapillary_coverage
