local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local SANITIZE_VALUES = require('topics.helper.sanitize_values')

---@alias DeriveSurfaceSource 'tag'
---@alias DeriveSurfaceConfidence 'high'
---@class DeriveSurfaceResultEmpty
---@field surface nil
---@field surface_source nil
---@field surface_confidence nil
---@class DeriveSurfaceResultTag
---@field surface string
---@field surface_source DeriveSurfaceSource
---@field surface_confidence DeriveSurfaceConfidence
---@alias DeriveSurfaceResult DeriveSurfaceResultEmpty|DeriveSurfaceResultTag

---@param tags OsmTags
---@return DeriveSurfaceResult
local function surface_direct(tags)
  if tags.surface ~= nil then
    local surface_source = 'tag'
    local surface_confidence = 'high'

    -- We use the same sanitizer but we dont have a setup to handle the disallowed values, yet, so we remove them right away.
    -- In the future, we want to setup a system similar to _parking_errors.
    local surface = SANITIZE_TAGS.surface(tags)
    if surface == SANITIZE_VALUES.disallowed then
      return { surface = nil, surface_source = nil, surface_confidence = nil, }
    end

    return { surface = surface, surface_source = surface_source, surface_confidence = surface_confidence, }
  end

  return { surface = nil, surface_source = nil, surface_confidence = nil, }
end

---@param tags OsmTags
---@return DeriveSurfaceResult
local function derive_surface(tags)
  return surface_direct(tags)
end

return derive_surface
