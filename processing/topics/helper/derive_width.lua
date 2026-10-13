local parse_length = require('topics.helper.parse_length')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')

---@alias DeriveWidthConfidence 'high'|'medium'
---@class DeriveWidthResultEmpty
---@field width nil
---@field width_source nil
---@field width_confidence nil
---@class DeriveWidthResult
---@field width number
---@field width_source string|nil
---@field width_confidence DeriveWidthConfidence
---@alias DeriveWidthResultUnion DeriveWidthResultEmpty|DeriveWidthResult

-- Mappers also mark an estimate on `width` itself, eg. `source:width=estimated` or `geschätzt nach Besichtigung`.
local estimate_source_patterns = { 'estimat', 'schätz', 'guess', 'approx' }

---@param width_source string|nil
---@return boolean
local function is_estimate_source(width_source)
  if not width_source then return false end
  local lowered = string.lower(width_source)
  for _, pattern in ipairs(estimate_source_patterns) do
    if string.find(lowered, pattern, 1, true) then return true end
  end
  return false
end

---Width as mapped in OSM: `width`, else `est_width`. No fallback when both are missing.
---`width_confidence` is `high` for a `width` and `medium` for an estimate (`est_width`, or a `width` whose source says estimated).
---`width_source` is the mapper's `source:width` (rarely `width:source`), for `width` and `est_width` alike.
---@param tags OsmTags
---@return DeriveWidthResultUnion
local function derive_width(tags)
  local width_source = SANITIZE_TAGS.safe_string(tags['source:width'] or tags['width:source'])

  local width = parse_length(tags.width)
  if width then
    return {
      width = width,
      width_source = width_source,
      width_confidence = is_estimate_source(width_source) and 'medium' or 'high',
    }
  end

  local est_width = parse_length(tags.est_width)
  if est_width then
    return {
      width = est_width,
      width_source = width_source,
      width_confidence = 'medium',
    }
  end

  return {
    width = nil,
    width_source = nil,
    width_confidence = nil,
  }
end

return derive_width
