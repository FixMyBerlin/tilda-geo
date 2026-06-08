local SET = require('topics.helper.sets')
local infer_address = require('topics.helper.infer_address')
local merge_table = require('topics.helper.merge_table')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local extract_public_tags = require('topics.helper.extract_public_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')
local S = require('topics.poiClassification.helper.sanitize_poi_classification_tags')

local formal_education = SET.set({
  'childcare',
  'college',
  'kindergarten',
  'research_institute',
  'school',
  'university',
})

---@param object {tags: table}
---@return table, table
local function result_tags_poi_classification(object)
  local tags = object.tags
  local result_tags = {
    name = SANITIZE_TAGS.safe_string(tags.name),
  }
  local address_tags = infer_address(tags)
  merge_table(result_tags, address_tags)

  if tags.shop then
    result_tags.category = S.resolve_category(tags.shop) or 'Einkauf'
    result_tags.type = 'shop-' .. S.type_suffix('shop', tags.shop)
  end
  if tags.amenity then
    result_tags.category = S.resolve_category(tags.amenity)
    result_tags.type = 'amenity-' .. S.type_suffix('amenity', tags.amenity)
  end
  if tags.tourism then
    result_tags.category = S.resolve_category(tags.tourism)
    result_tags.type = 'tourism-' .. S.type_suffix('tourism', tags.tourism)
  end
  if tags.leisure then
    result_tags.category = S.resolve_category(tags.leisure)
    result_tags.type = 'leisure-' .. S.type_suffix('leisure', tags.leisure)
  end

  if tags.amenity and formal_education[tags.amenity] then
    result_tags.formalEducation = tags.amenity
  end

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, object.tags, {})
end

return result_tags_poi_classification
