local bikelane_categories = require('topics.roads_bikelanes.bikelanes.bikelane_categories')
local transformations = require('topics.roads_bikelanes.bikelanes.transformations')

---Helper function to extract categories and tags by side from bikelanes input
---@param input_object table The input object with tags, id, type, etc.
---@return table CategoriesBySide
local function extract_categories_by_side(input_object)
  local cycleway_transformation = CenterLineTransformation.new({
    highway = 'cycleway',
    prefix = 'cycleway',
    direction_reference = 'self',
  })

  local transformed_objects = get_transformed_objects(input_object.tags, { cycleway_transformation })

  local self_tags = nil
  local left_tags = nil
  local right_tags = nil

  for _, transformed_tags in ipairs(transformed_objects) do
    if transformed_tags._side == 'self' then
      self_tags = transformed_tags
    elseif transformed_tags._side == 'left' then
      left_tags = transformed_tags
    elseif transformed_tags._side == 'right' then
      right_tags = transformed_tags
    end
  end

  local categorize_bikelane = bikelane_categories.categorize_bikelane
  local self_category = self_tags and categorize_bikelane(self_tags)
  local left_category = left_tags and categorize_bikelane(left_tags)
  local right_category = right_tags and categorize_bikelane(right_tags)

  return {
    self = { tags = self_tags, category = self_category },
    left = { tags = left_tags, category = left_category },
    right = { tags = right_tags, category = right_category },
  }
end

return extract_categories_by_side
