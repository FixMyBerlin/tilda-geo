require('init')
local SANITIZE_TAGS = require('sanitize_tags')
local THIS_OR_THAT = require('this_or_that')
local is_driveway = require('is_driveway')

--- Resolves operator_type for road-side parking: sanitizes tags and parent_tags,
--- then falls back to assumed_private when the road is below the regular street network (e.g. highway=service, track), otherwise assumed_public.
--- @param tags table OSM tags of the parking (way or segment)
--- @param parent_tags table|nil OSM tags of the parent road; nil when no road (e.g. separate parkings)
--- @return string|number 'private'|'public'|'assumed_private'|'assumed_public' (or sanitized value)
local function operator_type_for_road_parking(tags, parent_tags)
  local resolved = THIS_OR_THAT.value(
    SANITIZE_TAGS.operator_type(tags),
    SANITIZE_TAGS.operator_type(parent_tags)
  )
  if resolved then
    return resolved
  end
  if parent_tags and is_driveway(parent_tags) then
    return 'assumed_private'
  end
  return 'assumed_public'
end

return operator_type_for_road_parking
