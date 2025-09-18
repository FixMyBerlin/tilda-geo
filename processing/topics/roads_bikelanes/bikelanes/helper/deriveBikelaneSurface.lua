require('init')
require('DeriveSurface')
require('Set')

local function deriveBikelaneSurface(tags, categoryId)
  local surfaceResult = DeriveSurface(tags)
  local surface = surfaceResult.surface
  local surface_source = surfaceResult.surface_source
  local surface_confidence = surfaceResult.surface_confidence

  -- Categories that should copy surface values from parent highway
  local categoriesThatCopyFromParent = Set({
    'cyclewayOnHighway_advisory',
    'cyclewayOnHighway_exclusive',
    'cyclewayOnHighway_advisoryOrExclusive',
    'cyclewayOnHighwayBetweenLanes',
    'cyclewayOnHighwayProtected',
    'sharedBusLaneBikeWithBus',
    'sharedBusLaneBusWithBike',
    'bicycleRoad',
    'bicycleRoad_vehicleDestination',
  })
  if categoriesThatCopyFromParent[categoryId] and surface == nil and tags._parent and tags._parent.surface then
    local parentSurfaceResult = DeriveSurface(tags._parent)
    surface = parentSurfaceResult.surface
    surface_source = parentSurfaceResult.surface_source and 'parent_highway_' .. parentSurfaceResult.surface_source
    surface_confidence = parentSurfaceResult.surface_confidence
  end

  return { surface = surface, surface_source = surface_source, surface_confidence = surface_confidence }
end

return deriveBikelaneSurface
