local SET = require('topics.helper.sets')
local extract_keys = require('topics.helper.extract_keys')
local shopping_allowed_list_with_categories = require('topics.poiClassification.shopping_allowed_list_with_categories')

local allowed_values = SET.set(extract_keys(shopping_allowed_list_with_categories))

local function exit_processing(object)
  if not (object.tags.amenity or object.tags.shop or object.tags.tourism or object.tags.leisure) then
    return true
  end

  if object.tags.access == 'private' then
    return true
  end

  if object.tags.shop
    or allowed_values[object.tags.amenity]
    or allowed_values[object.tags.tourism]
    or allowed_values[object.tags.leisure]
  then
    if object.tags.tourism == 'information' then
      if object.tags.information == 'office' or object.tags.information == 'visitor_centre' then
        return false
      end
      return true
    end

    return false
  end

  return true
end

return exit_processing
