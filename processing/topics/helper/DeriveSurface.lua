local function surfaceDirect(surface)
  if surface ~= nil then
    local source = "tag"
    local confidence = "high"


    return surface, source, confidence
  end

  return nil, nil, nil
end

function DeriveSurface(tags)
  local surface, source, confidence = surfaceDirect(tags.surface)
  return { surface = surface, surface_source = source, surface_confidence = confidence }
end
