-- Only the OSM tags that mark a way as running next to a road.
---@param tags OsmTags
---@return boolean
local function is_tagged_as_sidepath(tags)
  return tags.is_sidepath == 'yes'
      or tags.footway == 'sidewalk'
      or tags.path == 'sidewalk'
      or tags.path == 'sidepath'
      or tags.cycleway == 'sidepath'
      or tags.steps == 'sidewalk'
end

-- The tags above, plus the ways split off a road centerline.
---@param tags OsmTags
---@return boolean
local function category_is_sidepath(tags)
  if is_tagged_as_sidepath(tags) then return true end

  -- Set when this way was split off the centerline; treat that as a sidepath.
  return tags.parent_road ~= nil
end

return {
  category_is_sidepath = category_is_sidepath,
  is_tagged_as_sidepath = is_tagged_as_sidepath,
}
