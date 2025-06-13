require('init')
require('sanitize_for_logging')
require('class_obstacle_category')
require('two_wheel_parking_helper')
require('amenity_parking_helper')
local TAG_HELPER = require('tag_helper')


obstacle_point_categories = {
  class_obstacle_category.new({
    id = 'bollard',
    perform_buffer = function(tags) return 0.3 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.barrier == 'bollard'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'barrier', 'access' },
  }),
  class_obstacle_category.new({
    id = 'street_lamp',
    perform_buffer = function(tags) return 0.4 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.highway == 'street_lamp'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'highway', 'ref' },
  }),
  class_obstacle_category.new({
    id = 'tree',
    perform_buffer = function(tags) return 1.5 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and (tags.natural == 'tree' or tags.natural == 'tree_stump')
    end,
    tags = function(tags) return { natural = sanitize_for_logging(tags.natural, { 'tree', 'tree_stump' }) } end,
    tags_cc = { 'natural', 'ref' },
  }),
  class_obstacle_category.new({
    id = 'street_cabinet', -- https://wiki.openstreetmap.org/wiki/Tag:man_made%3Dstreet_cabinet
    perform_buffer = function(tags) return 1.5 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.man_made == 'street_cabinet'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'street_cabinet' },
  }),
  class_obstacle_category.new({
    id = 'advertising', -- https://wiki.openstreetmap.org/wiki/Key:traffic_sign
    perform_buffer = function(tags) return 0.3 end,
    conditions = function(tags)
      -- highway=traffic_sign is not used a lot but a way to describe a unspecified sign
      return TAG_HELPER.is_obstacle_parking(tags) and (tags.traffic_sign ~= nil or tags.highway == 'traffic_sign')
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'traffic_sign', 'highway' },
  }),
  class_obstacle_category.new({
    id = 'turning_circle', -- https://wiki.openstreetmap.org/wiki/DE:Tag:highway%3Dturning_circle
    perform_buffer = function(tags) return 10 end,
    conditions = function(tags)
      return tags['highway'] == 'turning_circle'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'ref' },
  }),
  class_obstacle_category.new({
    id = 'turning_loop', -- https://wiki.openstreetmap.org/wiki/DE:Tag:highway%3Dturning_loop
    perform_buffer = function(tags) return 15 end,
    conditions = function(tags)
      return tags['highway'] == 'turning_loop'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'ref' },
  }),
  class_obstacle_category.new({
    id = 'bus_stop_conditional', -- https://overpass-turbo.eu/s/25Z1
    perform_buffer = function(tags) return 15 end,
    conditions = function(tags)
      return tags['highway'] == 'bus_stop' and tags.opening_hours ~= nil
    end,
    tags = function(tags) return { } end,
    tags_cc = { 'name', 'note', 'ref', 'opening_hours' },
  }),
  class_obstacle_category.new({
    id = 'bus_stop', -- https://wiki.openstreetmap.org/wiki/DE:Tag:highway%3Dbus_stop
    perform_buffer = function(tags) return 15 end,
    conditions = function(tags)
      return tags['highway'] == 'bus_stop' and tags.opening_hours == nil
    end,
    tags = function(tags) return { } end,
    tags_cc = { 'name', 'note', 'ref' },
  }),
  class_obstacle_category.new({
    id = 'loading_ramp',
    perform_buffer = function(tags) return 2 end,
    conditions = function(tags) return tags.amenity == 'loading_ramp' end,
    tags = function(tags) return { amenity = 'loading_ramp',  operator = tags.operator } end,
    tags_cc = {},
  }),
  class_obstacle_category.new({
    id = 'bicycle_parking',
    perform_buffer = function(tags) return two_wheel_parking_buffer(tags) end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'bicycle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'bicycle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('bicycle_parking'),
  }),
  class_obstacle_category.new({
    id = 'motorcycle_parking',
    perform_buffer = function(tags) return two_wheel_parking_buffer(tags) end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'motorcycle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'motorcycle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('motorcycle_parking'),
  }),
  class_obstacle_category.new({
    id = 'small_electric_vehicle_parking',
    -- Fixed buffer of 5m because SEV don't hava a capacity so our capacity based width does not work
    perform_buffer = function(tags) return 5 end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'small_electric_vehicle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'small_electric_vehicle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('small_electric_vehicle_parking'),
  }),
  class_obstacle_category.new({
    id = 'bicycle_rental',
    perform_buffer = function(tags) return two_wheel_parking_buffer(tags) end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'bicycle_rental') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'bicycle_rental') end,
    tags_cc = two_wheel_parking_tags_cc('bicycle_rental'),
  }),
  class_obstacle_category.new({
    id = 'mobility_hub',
    perform_buffer = function(tags) return two_wheel_parking_buffer(tags) end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'mobility_hub') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'mobility_hub') end,
    tags_cc = two_wheel_parking_tags_cc('mobility_hub'),
  }),
  class_obstacle_category.new({
    id = 'recycling',
    perform_buffer = function(tags) return tags.width or 5 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.amenity == 'recycling'
    end,
    tags = function(tags) return { amenity = tags.amenity } end,
    tags_cc = {},
  }),
  class_obstacle_category.new({
    id = 'vending_parking_tickets',
    perform_buffer = function(tags) return 1 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.amenity == 'vending_machine'
    end,
    tags = function(tags) return { amenity = tags.amenity } end,
    tags_cc = { 'vending', 'zone' },
  }),
}
