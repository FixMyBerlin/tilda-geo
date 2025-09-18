---@param tags table
---@return boolean
function IsSidepath(tags)
  return tags.is_sidepath == "yes"
      or tags._parent_highway -- indicates that this way was split of the centerline; in this case, we consider it a sidepath.
      or tags.footway == "sidewalk"
      or tags.path == "sidewalk"
      or tags.path == "sidepath"
      or tags.cycleway == "sidepath"
      or tags.steps == "sidewalk"
end
