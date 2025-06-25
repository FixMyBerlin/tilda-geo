require('init')
require('class_off_street_parking_category')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')

local off_street_parking_point_categories = {
  class_off_street_parking_category.new({
    id = 'parking_entrance', -- https://www.openstreetmap.org/node/7783387559
    conditions = function(tags) return tags.amenity == 'parking_entrance' end,
    tags = function(tags) return {
      amenity = tags.amenity,
      parking = SANITIZE_PARKING_TAGS.parking_entrance(tags.parking)
    } end,
    tags_cc = { 'access' },
    capacity_from_area = nil,
  }),
  class_off_street_parking_category.new({
    id = 'garage_entrance', -- https://www.openstreetmap.org/node/7773846323
    conditions = function(tags) return tags.entrance == 'garage' end,
    tags = function(tags) return {
      entrance = tags.entrance,
      parking = SANITIZE_PARKING_TAGS.parking_entrance(tags.parking)
    } end,
    tags_cc = { 'access' },
    capacity_from_area = nil,
  }),
}

return off_street_parking_point_categories
