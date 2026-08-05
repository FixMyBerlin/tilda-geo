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

---Derive road width from OSM `width` or fallback `est_width`, plus confidence and OSM `source:width`.
---@param tags OsmTags
---@return DeriveWidthResultUnion
local function derive_width(tags)
  local width_source = SANITIZE_TAGS.safe_string(tags['source:width'])

  local width = parse_length(tags.width)
  if width then
    return {
      width = width,
      width_source = width_source,
      width_confidence = 'high',
    }
  end

  width = parse_length(tags.est_width)
  if width then
    return {
      width = width,
      width_source = width_source,
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
