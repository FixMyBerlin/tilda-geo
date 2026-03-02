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
--- @param default_value string value when no tag: 'private' or 'public'
--- @return table { value = 'private'|'public', source = string, confidence = string }
local function operator_type_for_area(tags, osm_type, osm_id, default_value)
  local tag_value = SANITIZE_TAGS.operator_type(tags)
  if tag_value then
    -- Handle overwrite list
    if tag_value == 'public' and osm_type == 'way' and osm_id and WAY_IDS_OVERRIDE_TO_PRIVATE[osm_id] then
      return { value = 'private', source = 'manual_overwrite_list', confidence = 'high' }
    end
    return { value = tag_value, source = 'tag', confidence = 'high' }
  end
  return { value = default_value, source = 'default_fallback', confidence = 'medium' }
end

--- Resolves operator_type for road/line parking (parent_highway).
--- Uses tags first, then parent_tags (like surface_tags_with_parent); falls back to private when road is driveway, else fallback. No way-ID override.
--- @param tags table OSM tags of the parking (way or segment)
--- @param parent_tags table|nil OSM tags of the parent road
--- @param default_value string value when no tag/parent and not driveway: 'private' or 'public'
--- @return table { value = 'private'|'public', source = string, confidence = string }
local function operator_type_for_road_parking(tags, parent_tags, default_value)
  local tag_value = SANITIZE_TAGS.operator_type(tags)
  local parent_value = SANITIZE_TAGS.operator_type(parent_tags)
  local tag_result = { value = tag_value, source = 'tag', confidence = 'high' }
  local parent_result = { value = parent_value, source = 'parent_highway_tag', confidence = 'high' }
  local chosen = THIS_OR_THAT.value_confidence_source(tag_result, parent_result)
  if chosen.value then
    return chosen
  end
  if parent_tags and is_driveway(parent_tags) then
    return { value = 'private', source = 'driveway_inference', confidence = 'medium' }
  end
  return { value = default_value, source = 'default_fallback', confidence = 'medium' }
end

return {
  operator_type_for_area = operator_type_for_area,
  operator_type_for_road_parking = operator_type_for_road_parking,
}
