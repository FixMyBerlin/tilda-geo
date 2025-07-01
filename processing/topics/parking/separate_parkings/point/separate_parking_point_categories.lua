require('init')
require('class_separate_parking_category')
require('amenity_parking_helper')

local separate_parking_point_categories = {
  class_separate_parking_category.new({
    id = 'parking_lane',
    buffer_radius = function(tags) return amenity_parking_point_radius(tags) end,
    conditions = function(tags)
      return tags['amenity'] == 'parking' and tags['parking'] == 'lane'
    end,
    tags = function(tags) return amenity_parking_tags(tags) end,
    tags_cc = amenity_parking_tags_cc(),
  }),
  class_separate_parking_category.new({
    id = 'parking_street_side',
    buffer_radius = function(tags) return amenity_parking_point_radius(tags) end,
    conditions = function(tags)
      return tags['amenity'] == 'parking' and tags['parking'] == 'street_side'
    end,
    tags = function(tags) return amenity_parking_tags(tags) end,
    tags_cc = amenity_parking_tags_cc(),
    }),
  class_separate_parking_category.new({
    id = 'parking_kerb',
    buffer_radius = function(tags) return amenity_parking_point_radius(tags) end,
    conditions = function(tags)
      return tags.amenity == 'parking' and (tags.parking == 'on_kerb' or tags.parking == 'half_on_kerb')
    end,
    tags = function(tags) return amenity_parking_tags(tags) end,
    tags_cc = amenity_parking_tags_cc(),
  }),
  class_separate_parking_category.new({
    id = 'parking_shoulder',
    buffer_radius = function(tags) return amenity_parking_point_radius(tags) end,
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'shoulder'
    end,
    tags = function(tags) return amenity_parking_tags(tags) end,
    tags_cc = amenity_parking_tags_cc(),
  }),
}

return separate_parking_point_categories
