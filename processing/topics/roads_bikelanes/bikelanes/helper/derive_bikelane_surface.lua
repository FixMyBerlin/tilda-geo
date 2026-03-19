require('init')
local derive_surface = require('derive_surface')

---@param tags table
---@param category table
---@return table
local function derive_bikelane_surface(tags, category)
  local surface_result = derive_surface(tags)
  local surface = surface_result.surface
  local surface_source = surface_result.surface_source
  local surface_confidence = surface_result.surface_confidence

  if surface == nil and category.copySurfaceSmoothnessFromParent and tags._parent then
    local parent_surface_result = derive_surface(tags._parent)
    if parent_surface_result.surface then
      surface = parent_surface_result.surface
      surface_source = parent_surface_result.surface_source and 'parent_highway_' .. parent_surface_result.surface_source
      surface_confidence = parent_surface_result.surface_confidence
    end
  end

  return { surface = surface, surface_source = surface_source, surface_confidence = surface_confidence }
end

return derive_bikelane_surface
