require('init')
require('class_separate_parking_category')
require('two_wheel_parking_helper')
require('amenity_parking_helper')

local function is_obstacle_parking(tags)
  return tags['obstacle:parking'] == 'yes'
end

local separate_parking_point_categories = {
  class_separate_parking_category.new({
    -- https://www.openstreetmap.org/way/1198952905
    -- https://www.openstreetmap.org/way/1181489790 disabled
    id = 'parking_lane',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'lane'
    end,
    tags = function(tags) return amenity_parking_tags(tags) end,
    tags_cc = amenity_parking_tags_cc(),
    apply_parking_capacity_fallback = true,
  }),
  class_separate_parking_category.new({
    -- https://www.openstreetmap.org/way/559505481
    id = 'parking_street_side',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'street_side'
    end,
    tags = function(tags) return amenity_parking_tags(tags) end,
    tags_cc = amenity_parking_tags_cc(),
    apply_parking_capacity_fallback = true,
  }),
  class_separate_parking_category.new({
    id = 'parking_kerb',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags)
      return tags.amenity == 'parking' and (tags.parking == 'on_kerb' or tags.parking == 'half_on_kerb')
    end,
    tags = function(tags) return amenity_parking_tags(tags) end,
    tags_cc = amenity_parking_tags_cc(),
    apply_parking_capacity_fallback = true,
  }),
  class_separate_parking_category.new({
    id = 'parking_shoulder',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'shoulder'
    end,
    tags = function(tags) return amenity_parking_tags(tags) end,
    tags_cc = amenity_parking_tags_cc(),
    apply_parking_capacity_fallback = true,
  }),
}

return separate_parking_point_categories
