require('init')
require('class_off_street_parking_category')

local NIL_CAPACITY_TAGS = {
  value = nil,
  source = nil,
  confidence = nil,
}

local off_street_parking_point_categories = {
  class_off_street_parking_category.new({
    id = 'parking_entrance', -- https://www.openstreetmap.org/node/7783387559
    conditions = function(tags) return tags.amenity == 'parking_entrance' end,
    capacity_from_area = function(_, _) return NIL_CAPACITY_TAGS end,
  }),
  class_off_street_parking_category.new({
    id = 'garage_entrance', -- https://www.openstreetmap.org/node/7773846323
    conditions = function(tags) return tags.entrance == 'garage' end,
    capacity_from_area = function(_, _) return NIL_CAPACITY_TAGS end,
  }),
}

return off_street_parking_point_categories
