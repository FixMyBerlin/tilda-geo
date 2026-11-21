local exclude = require('topics.roads_bikelanes.helper.exclude_highways')

-- Stage 1: hard exit on tags only. Everything about restricted access (`private`, `service`,
-- `indoor`, `informal`, …) is decided by `access_restriction.lua`, which the callers run next.
---@param object_tags OsmTags
---@param include_areas boolean|nil keep `area=yes` (highwayAreas table)
---@return boolean
local function exit_processing(object_tags, include_areas)
  if exclude.by_highway_class(object_tags) then return true end
  if not include_areas and exclude.by_area(object_tags) then return true end
  if exclude.by_other_tags(object_tags) then return true end
  if exclude.by_access_no(object_tags) then return true end

  return false
end

return {
  exit_processing = exit_processing,
}
