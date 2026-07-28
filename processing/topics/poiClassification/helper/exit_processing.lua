local S = require('topics.poiClassification.helper.sanitize_poi_classification_tags')

local function exit_processing(object)
  if not (object.tags.amenity or object.tags.shop or object.tags.tourism or object.tags.leisure) then
    return true
  end

  if object.tags.access == 'private' then
    return true
  end

  if object.tags.shop
    or S.is_allowed_import_value(object.tags.amenity)
    or S.is_allowed_import_value(object.tags.tourism)
    or S.is_allowed_import_value(object.tags.leisure)
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
