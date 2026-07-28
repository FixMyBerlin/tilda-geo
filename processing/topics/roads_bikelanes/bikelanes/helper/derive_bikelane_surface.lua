local derive_surface = require('topics.helper.derive_surface')

---@alias DeriveBikelaneSurfaceSource 'tag'|'parent_highway_tag'
---@alias DeriveBikelaneSurfaceConfidence 'high'
---@class DeriveBikelaneSurfaceResultEmpty
---@field surface nil
---@field surface_source nil
---@field surface_confidence nil
---@class DeriveBikelaneSurfaceResultValue
---@field surface string
---@field surface_source DeriveBikelaneSurfaceSource
---@field surface_confidence DeriveBikelaneSurfaceConfidence
---@alias DeriveBikelaneSurfaceResult DeriveBikelaneSurfaceResultEmpty|DeriveBikelaneSurfaceResultValue

---@param tags OsmTags
---@param category BikelaneCategory
---@return DeriveBikelaneSurfaceResult
local function derive_bikelane_surface(tags, category)
  local surface_result = derive_surface(tags)
  if surface_result.surface ~= nil then
    return {
      surface = surface_result.surface,
      surface_source = 'tag',
      surface_confidence = 'high',
    }
  end

  local parent_tags = rawget(tags, '_parent')
  if category.copySurfaceSmoothnessFromParent and type(parent_tags) == 'table' then
    ---@cast parent_tags OsmTags
    local parent_surface_result = derive_surface(parent_tags)
    if parent_surface_result.surface ~= nil then
      return {
        surface = parent_surface_result.surface,
        surface_source = 'parent_highway_tag',
        surface_confidence = 'high',
      }
    end
  end

  return { surface = nil, surface_source = nil, surface_confidence = nil, }
end

return derive_bikelane_surface
