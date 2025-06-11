require('init')
require('class_off_street_parking_category')
require('sanitize_for_logging')

local off_street_parking_point_categories = {
  class_off_street_parking_category.new({
    id = 'parking_entrance', -- https://www.openstreetmap.org/node/7783387559
    conditions = function(tags) return tags.amenity	== "parking_entrance" end,
    tags = function(tags) return {
      amenity = tags.amenity,
      parking = sanitize_for_logging(tags.parking, { 'depot', 'underground', 'multi-storey' })
    } end,
    tags_cc = { 'access' },
    capacity_from_area = nil,
  }),
  class_off_street_parking_category.new({
    id = 'garage_entrance', -- https://www.openstreetmap.org/node/7773846323
    conditions = function(tags) return tags.entrance	== "garage" end,
    tags = function(tags) return {
      entrance = tags.entrance,
      parking = sanitize_for_logging(tags.parking, { 'depot', 'underground', 'multi-storey' })
    } end,
    tags_cc = { 'access' },
    capacity_from_area = nil,
  }),
}

return off_street_parking_point_categories
