local extract_public_tags = require('topics.helper.extract_public_tags')
local sanitize_traffic_sign = require('topics.helper.sanitize_traffic_sign')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')

---@param tags OsmTags
---@param traffic_sign table
---@param direction number|nil
---@param direction_source string|nil
---@return table, table
local function result_tags_traffic_signs(tags, traffic_sign, direction, direction_source)
  local raw_traffic_sign = tags.traffic_sign or tags['traffic_sign:both']
  if traffic_sign and traffic_sign.traffic_sign then
    raw_traffic_sign = traffic_sign.traffic_sign
  end

  local result_tags = {
    traffic_sign = sanitize_traffic_sign(raw_traffic_sign),
    offset = traffic_sign.offset,
    direction = direction,
    direction_source = direction_source,
    description = SANITIZE_TAGS.safe_string(tags.description or tags.note),
    mapillary = SANITIZE_TAGS.safe_string(tags.mapillary),
    ['osm_traffic_sign:direction'] = SANITIZE_TAGS.safe_string(tags['traffic_sign:direction']),
    ['osm_traffic_sign:forward'] = SANITIZE_TAGS.safe_string(tags['traffic_sign:forward']),
    ['osm_traffic_sign:backward'] = SANITIZE_TAGS.safe_string(tags['traffic_sign:backward']),
    ['osm_traffic_sign:both'] = SANITIZE_TAGS.safe_string(tags['traffic_sign:both']),
    osm_direction = SANITIZE_TAGS.safe_string(tags.direction),
  }

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, tags, {})
end

return result_tags_traffic_signs
