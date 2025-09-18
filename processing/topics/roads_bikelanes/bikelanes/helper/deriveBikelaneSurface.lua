require('init')
require('DeriveSurface')

local function deriveBikelaneSurface(tags, category)
  local surfaceResult = DeriveSurface(tags)
  local surface = surfaceResult.surface
  local surface_source = surfaceResult.surface_source
  local surface_confidence = surfaceResult.surface_confidence

  if surface == nil and category.copySurfaceSmoothnessFromParent and tags._parent then
    local parentSurfaceResult = DeriveSurface(tags._parent)
    if parentSurfaceResult.surface then
      surface = parentSurfaceResult.surface
      surface_source = parentSurfaceResult.surface_source and 'parent_highway_' .. parentSurfaceResult.surface_source
      surface_confidence = parentSurfaceResult.surface_confidence
    end
  end

  return { surface = surface, surface_source = surface_source, surface_confidence = surface_confidence }
end

return deriveBikelaneSurface
