require('init')
require('class_off_street_parking_category')

local off_street_parking_point_categories = {
  class_off_street_parking_category.new({
    id = 'parking_entrance', -- https://www.openstreetmap.org/node/7783387559
    conditions = function(tags) return tags.amenity == 'parking_entrance' end,
    capacity_from_area = nil,
  }),
  class_off_street_parking_category.new({
    id = 'garage_entrance', -- https://www.openstreetmap.org/node/7773846323
    conditions = function(tags) return tags.entrance == 'garage' end,
    capacity_from_area = nil,
  }),
}

return off_street_parking_point_categories
