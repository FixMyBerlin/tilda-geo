require('init')
require('Set')
require('Log')
require('DeriveSmoothness')
local has_prefix = require('has_prefix')

local function deriveBikelaneSmoothness(tags, categoryId)
  local smoothnessResult = DeriveSmoothness(tags)
  local smoothness = smoothnessResult.smoothness
  local smoothness_source = smoothnessResult.smoothness_source
  local smoothness_confidence = smoothnessResult.smoothness_confidence

  local applyParentSmoothness = false
  -- We copy smoothness from parent only …
  -- - …for categoryId=cyclewayOnHighway* which shares the same surface
  local copyValueFromParent = has_prefix(categoryId, 'cyclewayOnHighway')
  if copyValueFromParent and tags._parent then
    -- - …when no smoothness is present
    -- - …when a parent-smoothness is present
    -- - …when no surface is present or the surface is the same as the parent (because otherwise the smoothness fallback should be different)
    if smoothness == nil and tags._parent.smoothness ~= nil then
      if tags.surface == nil or tags.surface == tags._parent.surface then
        applyParentSmoothness = true
      end
    end

    -- - … when the bikelane smoothness is not sourced from tag (derived smoothness)
    --    - … AND the parent has a surface which is the same surface
    --    - … AND the parent has an explicit smoothness
    local okSources = Set({'tag', 'tag_normalized'})
    if okSources[smoothness_source] ~= true and tags.surface ~= nil and tags.surface == tags._parent.surface and tags._parent.smoothness ~= nil then
      applyParentSmoothness = true
    end

    if applyParentSmoothness then
      local parentSmoothnessResult = DeriveSmoothness(tags._parent)
      smoothness = parentSmoothnessResult.smoothness
      smoothness_source = 'parent_highway_' .. parentSmoothnessResult.smoothness_source
      smoothness_confidence = parentSmoothnessResult.smoothness_confidence
    end

  end

  return { smoothness = smoothness, smoothness_source = smoothness_source, smoothness_confidence = smoothness_confidence }
end

return deriveBikelaneSmoothness
