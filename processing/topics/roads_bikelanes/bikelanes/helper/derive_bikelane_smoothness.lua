local SET = require('topics.helper.sets')
local log = require('topics.helper.log')
local derive_smoothness = require('topics.helper.derive_smoothness')

---@alias DeriveBikelaneSmoothnessConfidence 'high'|'medium'
---@class DeriveBikelaneSmoothnessResultEmpty
---@field smoothness nil
---@field smoothness_source nil
---@field smoothness_confidence nil
---@class DeriveBikelaneSmoothnessResultValue
---@field smoothness string
---@field smoothness_source string
---@field smoothness_confidence DeriveBikelaneSmoothnessConfidence
---@alias DeriveBikelaneSmoothnessResult DeriveBikelaneSmoothnessResultEmpty|DeriveBikelaneSmoothnessResultValue

---@param tags OsmTags
---@param category BikelaneCategory
---@return DeriveBikelaneSmoothnessResult
local function derive_bikelane_smoothness(tags, category)
  local smoothness_result = derive_smoothness(tags)
  local smoothness = smoothness_result.smoothness
  local smoothness_source = smoothness_result.smoothness_source
  local smoothness_confidence = smoothness_result.smoothness_confidence

  local apply_parent_smoothness = false

  local parent_tags = rawget(tags, '_parent')
  if category.copySurfaceSmoothnessFromParent and type(parent_tags) == 'table' then
    ---@cast parent_tags OsmTags
    local parent_smoothness_result = derive_smoothness(parent_tags)

    if smoothness == nil and parent_smoothness_result.smoothness ~= nil then
      if tags.surface == nil or tags.surface == parent_tags.surface then
        apply_parent_smoothness = true
      end
    end

    local ok_sources = SET.set({ 'tag', 'tag_normalized' })
    local smoothness_source_is_not_trusted = ok_sources[smoothness_source] ~= true
    local surface_matches_parent = tags.surface ~= nil and tags.surface == parent_tags.surface
    local parent_has_smoothness = parent_smoothness_result.smoothness ~= nil

    if smoothness_source_is_not_trusted and surface_matches_parent and parent_has_smoothness then
      apply_parent_smoothness = true
    end

    if apply_parent_smoothness then
      smoothness = parent_smoothness_result.smoothness
      smoothness_source = parent_smoothness_result.smoothness_source and 'parent_highway_' .. parent_smoothness_result.smoothness_source
      smoothness_confidence = parent_smoothness_result.smoothness_confidence
    end
  end

  if smoothness ~= nil and smoothness_source ~= nil and smoothness_confidence ~= nil then
    return {
      smoothness = smoothness,
      smoothness_source = smoothness_source,
      smoothness_confidence = smoothness_confidence,
    }
  end

  return { smoothness = nil, smoothness_source = nil, smoothness_confidence = nil, }
end

return derive_bikelane_smoothness
