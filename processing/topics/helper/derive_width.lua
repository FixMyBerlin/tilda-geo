local parse_length = require('topics.helper.parse_length')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')

---@alias DeriveWidthConfidence 'high'|'low'
---@class DeriveWidthResultEmpty
---@field width nil
---@field width_source nil
---@field width_confidence nil
---@class DeriveWidthResult
---@field width number
---@field width_source string|nil
---@field width_confidence DeriveWidthConfidence
---@alias DeriveWidthResultUnion DeriveWidthResultEmpty|DeriveWidthResult

---Derive width from OSM `width` or fallback `est_width`, plus confidence and OSM `source:width`.
---When `width` is present but unparsable, its `source:width` describes that broken value, so we drop it for the `est_width` fallback.
---@param tags OsmTags
---@return DeriveWidthResultUnion
local function derive_width(tags)
  local width = parse_length(tags.width)
  if width then
    return {
      width = width,
      width_source = SANITIZE_TAGS.safe_string(tags['source:width']),
      width_confidence = 'high',
    }
  end

  local est_width = parse_length(tags.est_width)
  if est_width then
    return {
      width = est_width,
      width_source = tags.width == nil and SANITIZE_TAGS.safe_string(tags['source:width']) or nil,
      width_confidence = 'low',
    }
  end

  return {
    width = nil,
    width_source = nil,
    width_confidence = nil,
  }
end

return derive_width
