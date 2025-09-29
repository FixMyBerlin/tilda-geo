require('init')
require('BikelaneCategories')
require('transformations')

---@class BikelaneCategory
---@field id string
---@field desc string
---@field infrastructureExists boolean
---@field implicitOneWay boolean
---@field implicitOneWayConfidence string
---@field copySurfaceSmoothnessFromParent boolean

---@class SideData
---@field tags table|nil The transformed tags for this side
---@field category BikelaneCategory|nil The categorized bikelane category for this side

---@class CategoriesBySide
---@field self SideData The center/self geometry data
---@field left SideData The left side geometry data
---@field right SideData The right side geometry data

---Helper function to extract categories and tags by side from bikelanes input
---@param input_object table The input object with tags, id, type, etc.
---@return CategoriesBySide
local function extractCategoriesBySide(input_object)
  -- Create the cycleway transformation
  local cyclewayTransformation = CenterLineTransformation.new({
    highway = 'cycleway',
    prefix = 'cycleway',
    direction_reference = 'self'
  })

  -- Apply cycleway transformation
  local transformedObjects = GetTransformedObjects(input_object.tags, { cyclewayTransformation })

  local self_tags = nil
  local left_tags = nil
  local right_tags = nil

  for _, transformed_tags in ipairs(transformedObjects) do
    if transformed_tags._side == 'self' then
      self_tags = transformed_tags
    elseif transformed_tags._side == 'left' then
      left_tags = transformed_tags
    elseif transformed_tags._side == 'right' then
      right_tags = transformed_tags
    end
  end

  local self_category = self_tags and CategorizeBikelane(self_tags)
  local left_category = left_tags and CategorizeBikelane(left_tags)
  local right_category = right_tags and CategorizeBikelane(right_tags)

  return {
    self = { tags = self_tags, category = self_category },
    left = { tags = left_tags, category = left_category },
    right = { tags = right_tags, category = right_category }
  }
end

return extractCategoriesBySide
