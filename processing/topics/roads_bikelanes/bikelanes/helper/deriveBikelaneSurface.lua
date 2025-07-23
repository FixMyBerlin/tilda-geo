require('init')
require('DeriveSurface')
local has_prefix = require('has_prefix')

local function deriveBikelaneSurface(tags, categoryId)
  local surfaceResult = DeriveSurface(tags)
  local surface = surfaceResult.surface
  local surface_source = surfaceResult.surface_source
  local surface_confidence = surfaceResult.surface_confidence

  local copyValueFromParent = has_prefix(categoryId, 'cyclewayOnHighway') -- for lane like categories
  if copyValueFromParent and surface == nil and tags._parent and tags._parent.surface then
    local parentSurfaceResult = DeriveSurface(tags._parent)
    surface = parentSurfaceResult.surface
    surface_source = 'parent_highway_' .. parentSurfaceResult.surface_source
    surface_confidence = parentSurfaceResult.surface_confidence
  end

  return { surface = surface, surface_source = surface_source, surface_confidence = surface_confidence }
end

return deriveBikelaneSurface
