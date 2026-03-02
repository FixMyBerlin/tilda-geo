require('init')
local SANITIZE_TAGS = require('sanitize_tags')
local THIS_OR_THAT = require('this_or_that')
local is_driveway = require('is_driveway')
local WAY_IDS_OVERRIDE_TO_PRIVATE = require('operator_type_override_public_to_private')

--- Resolves operator_type for parking areas (e.g. off-street, separate parking areas).
--- Uses tags only; when resolved is "public", applies manual way-ID override (see operator_type_override_public_to_private.lua).
--- @param tags table OSM tags of the parking
--- @param osm_type string|nil OSM object type (e.g. 'way'); when 'way' and osm_id present, used for override lookup
--- @param osm_id number|nil OSM object id (e.g. way id)
--- @param fallback string fallback when resolved is nil
--- @return string|number 'private'|'public'|'assumed_private'|'assumed_public' (or sanitized value)
local function operator_type_for_area(tags, osm_type, osm_id, fallback)
  local resolved = SANITIZE_TAGS.operator_type(tags)
  if resolved then
    if resolved == 'public' and osm_type == 'way' and osm_id and WAY_IDS_OVERRIDE_TO_PRIVATE[osm_id] then
      return 'private'
    end
    return resolved
  end
  return fallback
end

--- Resolves operator_type for road/line parking (parent_highway).
--- Uses tags and parent_tags; falls back to assumed_private when road is driveway, else fallback. No way-ID override.
--- @param tags table OSM tags of the parking (way or segment)
--- @param parent_tags table|nil OSM tags of the parent road
--- @param fallback string fallback when resolved is nil and no driveway
--- @return string|number 'private'|'public'|'assumed_private'|'assumed_public' (or sanitized value)
local function operator_type_for_road_parking(tags, parent_tags, fallback)
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
  return fallback
end

return {
  operator_type_for_area = operator_type_for_area,
  operator_type_for_road_parking = operator_type_for_road_parking,
}
