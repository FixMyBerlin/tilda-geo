require('init')
require('class_separate_parking_category')

local separate_parking_point_categories = {
  class_separate_parking_category.new({
    id = 'parking_lane',
    conditions = function(tags)
      return tags['amenity'] == 'parking' and tags['parking'] == 'lane'
    end,
  }),
  class_separate_parking_category.new({
    id = 'parking_street_side',
    conditions = function(tags)
      return tags['amenity'] == 'parking' and tags['parking'] == 'street_side'
    end,
  }),
  class_separate_parking_category.new({
    id = 'parking_kerb',
    conditions = function(tags)
      return tags.amenity == 'parking' and (tags.parking == 'on_kerb' or tags.parking == 'half_on_kerb')
    end,
  }),
  class_separate_parking_category.new({
    id = 'parking_shoulder',
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'shoulder'
    end,
  }),
}

return separate_parking_point_categories
