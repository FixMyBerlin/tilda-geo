local derive_width = require('topics.helper.derive_width')
local highway_width_fallbacks = require('topics.helper.highway_width_fallbacks')

---@class DeriveWidthWithFallbackResult
---@field width number
---@field width_source string|nil mapper's `source:width`, or `highway_default` / `highway_default_and_oneway` for the fallback
---@field width_confidence 'high'|'medium'|'low'

---Carriageway width that is never empty: `derive_width`, else the default of the highway class (`width_confidence=low`).
---For consumers that need a number (parking geometry, visual offsets, routing). `roads` and `bikelanes` publish `derive_width` only.
---@param tags OsmTags needs `highway` and `oneway` for the fallback
---@return DeriveWidthWithFallbackResult
local function derive_width_with_fallback(tags)
  local mapped = derive_width(tags)
  if mapped.width then
    return mapped
  end

  local fallback = highway_width_fallbacks.derive_highway_width_fallback(
    tags.highway,
    highway_width_fallbacks.is_oneway_highway(tags.oneway)
  )
  return {
    width = fallback.value,
    width_source = fallback.source,
    width_confidence = 'low',
  }
end

return derive_width_with_fallback
