require('init')
require('class_obstacle_category')
require('two_wheel_parking_helper')

local function is_obstacle_parking(tags)
  return tags['obstacle:parking'] == 'yes'
end

obstacle_area_categories = {
  class_obstacle_category.new({
    id = 'bicycle_parking',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'bicycle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'bicycle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('bicycle_parking'),
  }),
  class_obstacle_category.new({
    id = 'motorcycle_parking',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'motorcycle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'motorcycle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('motorcycle_parking'),
  }),
  class_obstacle_category.new({
    id = 'small_electric_vehicle_parking',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'small_electric_vehicle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'small_electric_vehicle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('small_electric_vehicle_parking'),
  }),
  class_obstacle_category.new({
    id = 'bicycle_rental',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'bicycle_rental') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'bicycle_rental') end,
    tags_cc = two_wheel_parking_tags_cc('bicycle_rental'),
  }),
  class_obstacle_category.new({
    id = 'mobility_hub',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'mobility_hub') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'mobility_hub') end,
    tags_cc = two_wheel_parking_tags_cc('mobility_hub'),
  }),
  class_obstacle_category.new({
    id = 'parklet',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags)
      return tags.leisure == 'parklet' or tags.leisure == 'outdoor_seating' and tags.outdoor_seating == 'parklet'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'leisure', 'outdoor_seating' },
  }),
  class_obstacle_category.new({
    id = 'road_marking_restricted_area',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags)
      return tags['area:highway'] == 'prohibited' or tags.road_marking == 'restriction'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'area:highway', 'road_marking' },
  }),
  class_obstacle_category.new({
    -- https://www.openstreetmap.org/way/1127983079
    id = 'tree_pit',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags)
      return is_obstacle_parking(tags) and tags.landuse == "tree_pit"
    end,
    tags = function(tags) return { landuse = tags.landuse } end,
    tags_cc = {},
  }),
  class_obstacle_category.new({
    id = 'kerb_extension',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags)
      return tags.traffic_calming == 'kerb_extension'
    end,
    tags = function(tags) return { traffic_calming = tags.traffic_calming } end,
    tags_cc = { 'traffic_calming' },
  }),
}
