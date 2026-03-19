require('init')
local SET = require('sets')
local log = require('log')
local derive_smoothness = require('derive_smoothness')

---@param tags table
---@param category table
---@return table
local function derive_bikelane_smoothness(tags, category)
  local smoothness_result = derive_smoothness(tags)
  local smoothness = smoothness_result.smoothness
  local smoothness_source = smoothness_result.smoothness_source
  local smoothness_confidence = smoothness_result.smoothness_confidence

  local apply_parent_smoothness = false

  if category.copySurfaceSmoothnessFromParent and tags._parent then
    local parent_smoothness_result = derive_smoothness(tags._parent)

    if smoothness == nil and parent_smoothness_result.smoothness ~= nil then
      if tags.surface == nil or tags.surface == tags._parent.surface then
        apply_parent_smoothness = true
      end
    end

    local ok_sources = SET.set({ 'tag', 'tag_normalized' })
    local smoothness_source_is_not_trusted = ok_sources[smoothness_source] ~= true
    local surface_matches_parent = tags.surface ~= nil and tags.surface == tags._parent.surface
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

  return { smoothness = smoothness, smoothness_source = smoothness_source, smoothness_confidence = smoothness_confidence }
end

return derive_bikelane_smoothness
