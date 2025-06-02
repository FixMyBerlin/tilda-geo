require('init')
require('class_obstacle_category')
require('two_wheel_parking_helper')
require('amenity_parking_helper')

local function is_obstacle_parking(tags)
  return tags['obstacle:parking'] == 'yes'
end

obstacle_area_categories = {
  class_obstacle_category.new({
    id = 'bicycle_parking',
    perform_buffer = function(tags) return nil end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'bicycle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'bicycle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('bicycle_parking'),
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'motorcycle_parking',
    perform_buffer = function(tags) return nil end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'motorcycle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'motorcycle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('motorcycle_parking'),
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'small_electric_vehicle_parking',
    perform_buffer = function(tags) return nil end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'small_electric_vehicle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'small_electric_vehicle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('small_electric_vehicle_parking'),
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'bicycle_rental',
    perform_buffer = function(tags) return nil end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'bicycle_rental') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'bicycle_rental') end,
    tags_cc = two_wheel_parking_tags_cc('bicycle_rental'),
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'mobility_hub',
    perform_buffer = function(tags) return nil end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'mobility_hub') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'mobility_hub') end,
    tags_cc = two_wheel_parking_tags_cc('mobility_hub'),
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'parklet',
    perform_buffer = function(tags) return nil end,
    conditions = function(tags)
      return tags.leisure == 'parklet' or tags.leisure == 'outdoor_seating' and tags.outdoor_seating == 'parklet'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'leisure', 'outdoor_seating' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'road_marking_restricted_area',
    perform_buffer = function(tags) return nil end,
    conditions = function(tags)
      return tags['area:highway'] == 'prohibited'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'area:highway' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    -- https://www.openstreetmap.org/way/1198952905
    -- https://www.openstreetmap.org/way/1181489790 disabled
    id = 'parking_lane',
    perform_buffer = function(tags) return nil end,
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'lane'
    end,
    tags = function(tags) return amenity_parking_tags(tags) end,
    tags_cc = amenity_parking_tags_cc(),
    apply_parking_capacity_fallback = true,
  }),
  class_obstacle_category.new({
    -- https://www.openstreetmap.org/way/559505481
    id = 'parking_street_side',
    perform_buffer = function(tags) return nil end,
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'street_side'
    end,
    tags = function(tags) return amenity_parking_tags(tags) end,
    tags_cc = amenity_parking_tags_cc(),
    apply_parking_capacity_fallback = true,
  }),
  class_obstacle_category.new({
    id = 'parking_kerb',
    perform_buffer = function(tags) return nil end,
    conditions = function(tags)
      return tags.amenity == 'parking' and (tags.parking == 'on_kerb' or tags.parking == 'half_on_kerb')
    end,
    tags = function(tags) return amenity_parking_tags(tags) end,
    tags_cc = amenity_parking_tags_cc(),
    apply_parking_capacity_fallback = true,
  }),
  class_obstacle_category.new({
    id = 'parking_shoulder',
    perform_buffer = function(tags) return nil end,
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'shoulder'
    end,
    tags = function(tags) return amenity_parking_tags(tags) end,
    tags_cc = amenity_parking_tags_cc(),
    apply_parking_capacity_fallback = true,
  }),
  class_obstacle_category.new({
    -- https://www.openstreetmap.org/way/1127983079
    id = 'tree_pit',
    perform_buffer = function(tags) return nil end,
    conditions = function(tags)
      return is_obstacle_parking(tags) and tags.landuse == "tree_pit"
    end,
    tags = function(tags) return { landuse = tags.landuse } end,
    tags_cc = {},
    apply_parking_capacity_fallback = false,
  }),
}
