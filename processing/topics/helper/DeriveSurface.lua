require('init')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_VALUES = require('sanitize_values')

local function surfaceDirect(tags)
  if tags.surface ~= nil then
    local surface_source = "tag"
    local surface_confidence = "high"

    -- We use the same sanitizer but we dont have a setup to handle the disallowed values, yet, so we remove them right away.
    -- In the future, we want to setup a system similar to _parking_errors.
    local surface = SANITIZE_TAGS.surface(tags)
    if surface == SANITIZE_VALUES.disallowed then return nil, nil, nil end

    return surface, surface_source, surface_confidence
  end

  return nil, nil, nil
end

function DeriveSurface(tags)
  local surface, surface_source, surface_confidence = surfaceDirect(tags)

  return { surface = surface, surface_source = surface_source, surface_confidence = surface_confidence }
end
