require('init')
local SET = require('sets')
local infer_address = require('infer_address')
local merge_table = require('merge_table')
local SANITIZE_TAGS = require('sanitize_tags')
local shopping_allowed_list_with_categories = require('shopping_allowed_list_with_categories')
local extract_public_tags = require('extract_public_tags')
local CLEANER = require('sanitize_cleaner')

local formal_education = SET.set({
  'childcare',
  'college',
  'kindergarten',
  'research_institute',
  'school',
  'university',
})

local function result_tags_poi_classification(object)
  local tags = object.tags
  local result_tags = {
    name = SANITIZE_TAGS.safe_string(tags.name),
  }
  local address_tags = infer_address(tags)
  merge_table(result_tags, address_tags)

  if tags.shop then
    result_tags.category = 'Einkauf'
    result_tags.type = 'shop-' .. tags.shop
  end
  if tags.amenity then
    result_tags.category = shopping_allowed_list_with_categories[tags.amenity]
    result_tags.type = 'amenity-' .. tags.amenity
  end
  if tags.tourism then
    result_tags.category = shopping_allowed_list_with_categories[tags.tourism]
    result_tags.type = 'tourism-' .. tags.tourism
  end
  if tags.leisure then
    result_tags.category = shopping_allowed_list_with_categories[tags.leisure]
    result_tags.type = 'leisure-' .. tags.leisure
  end

  if tags.amenity and formal_education[tags.amenity] then
    result_tags.formalEducation = tags.amenity
  end

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, object.tags, {})
end

return result_tags_poi_classification
