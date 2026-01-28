require('init')
local SANITIZE_TAGS = require('sanitize_tags')
local THIS_OR_THAT = require('this_or_that')

--- Creates surface_tags table with value, confidence, and source
--- Only sets confidence and source when value is present
---@param tags table<string, string|nil> Object tags containing surface information
---@return {value: string|nil, confidence: string|nil, source: string|nil}
local function surface_tags(tags)
  local surface_value = SANITIZE_TAGS.surface(tags)
  local original_tag_value = tags.surface

  if surface_value == nil then
    return {
      value = nil,
      confidence = nil,
      source = nil,
    }
  end

  return {
    value = surface_value,
    confidence = 'high',
    source = original_tag_value == surface_value and 'tag' or 'tag_transformed',
  }
end

--- Creates surface_tags with parent fallback support
--- Uses primary tags first, falls back to parent tags if primary has no surface
--- Only sets confidence and source when value is present
---@param tags table<string, string|nil> Primary object tags containing surface information
---@param parent_tags table<string, string|nil> Parent tags to use as fallback
---@return {value: string|nil, confidence: string|nil, source: string|nil}
local function surface_tags_with_parent(tags, parent_tags)
  local primary_surface_tags = surface_tags(tags)
  local parent_surface_tags = surface_tags(parent_tags)

  -- Adjust parent source to use 'parent_highway_tag' prefix instead of 'tag'
  if parent_surface_tags.source then
    parent_surface_tags.source = parent_surface_tags.source == 'tag' and 'parent_highway_tag' or 'parent_highway_tag_transformed'
    parent_surface_tags.confidence = 'medium'
  end

  return THIS_OR_THAT.value_confidence_source(primary_surface_tags, parent_surface_tags)
end

return {
  surface_tags = surface_tags,
  surface_tags_with_parent = surface_tags_with_parent,
}
