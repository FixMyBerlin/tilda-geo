require('init')
local sanitize_for_logging = require('sanitize_for_logging')
require('class_obstacle_category')
require('two_wheel_parking_helper')
local TAG_HELPER = require('tag_helper')


obstacle_point_categories = {
  class_obstacle_category.new({
    id = 'bollard',
    buffer_radius = function(tags) return 0.3 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.barrier == 'bollard'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'barrier', 'access' },
  }),
  class_obstacle_category.new({
    id = 'street_lamp',
    buffer_radius = function(tags) return 0.4 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.highway == 'street_lamp'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'highway', 'ref' },
  }),
  class_obstacle_category.new({
    id = 'tree',
    buffer_radius = function(tags) return 1.5 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and (tags.natural == 'tree' or tags.natural == 'tree_stump')
    end,
    tags = function(tags) return { natural = sanitize_for_logging(tags.natural, { 'tree', 'tree_stump' }) } end,
    tags_cc = { 'natural', 'ref' },
  }),
  class_obstacle_category.new({
    id = 'street_cabinet', -- https://wiki.openstreetmap.org/wiki/Tag:man_made%3Dstreet_cabinet
    buffer_radius = function(tags) return 1.5 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.man_made == 'street_cabinet'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'street_cabinet' },
  }),
  class_obstacle_category.new({
    id = 'traffic_sign', -- https://wiki.openstreetmap.org/wiki/Key:traffic_sign
    buffer_radius = function(tags) return 0.3 end,
    conditions = function(tags)
      -- highway=traffic_sign is not used a lot but a way to describe a unspecified sign
      return TAG_HELPER.is_obstacle_parking(tags) and (tags.traffic_sign ~= nil or tags.highway == 'traffic_sign')
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'traffic_sign', 'highway' },
  }),
  class_obstacle_category.new({
    id = 'loading_ramp',
    buffer_radius = function(tags) return 2 end,
    conditions = function(tags) return tags.amenity == 'loading_ramp' end,
    tags = function(tags) return { amenity = 'loading_ramp',  operator = tags.operator } end,
    tags_cc = {},
  }),
  class_obstacle_category.new({
    id = 'bicycle_parking',
    buffer_radius = function(tags) return two_wheel_parking_buffer(tags) end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'bicycle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'bicycle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('bicycle_parking'),
  }),
  class_obstacle_category.new({
    id = 'motorcycle_parking',
    buffer_radius = function(tags) return two_wheel_parking_buffer(tags) end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'motorcycle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'motorcycle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('motorcycle_parking'),
  }),
  class_obstacle_category.new({
    id = 'small_electric_vehicle_parking',
    -- Fixed buffer of 5m because SEV don't hava a capacity so our capacity based width does not work
    buffer_radius = function(tags) return 5 end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'small_electric_vehicle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'small_electric_vehicle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('small_electric_vehicle_parking'),
  }),
  class_obstacle_category.new({
    id = 'bicycle_rental',
    buffer_radius = function(tags) return two_wheel_parking_buffer(tags) end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'bicycle_rental') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'bicycle_rental') end,
    tags_cc = two_wheel_parking_tags_cc('bicycle_rental'),
  }),
  class_obstacle_category.new({
    id = 'mobility_hub',
    buffer_radius = function(tags) return two_wheel_parking_buffer(tags) end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'mobility_hub') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'mobility_hub') end,
    tags_cc = two_wheel_parking_tags_cc('mobility_hub'),
  }),
  class_obstacle_category.new({
    id = 'recycling',
    buffer_radius = function(tags) return tags.width or 5 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.amenity == 'recycling'
    end,
    tags = function(tags) return { amenity = tags.amenity } end,
    tags_cc = {},
  }),
  class_obstacle_category.new({
    id = 'vending_parking_tickets',
    buffer_radius = function(tags) return 1 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.amenity == 'vending_machine'
    end,
    tags = function(tags) return { amenity = tags.amenity } end,
    tags_cc = { 'vending', 'zone' },
  }),
  class_obstacle_category.new({
    -- https://wiki.openstreetmap.org/wiki/DE:Tag:emergency=fire_hydrant
    -- https://overpass-turbo.eu/s/261C
    id = 'fire_hydrant',
    buffer_radius = function(tags) return 0.5 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.emergency == 'fire_hydrant'
    end,
    tags = function(tags) return { emergency = tags.emergency } end,
    tags_cc = { 'ref', 'fire_hydrant:type', 'fire_hydrant:position' },
  }),
  class_obstacle_category.new({
    id = 'water_well',
    buffer_radius = function(tags) return 1.5 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.man_made == 'water_well'
    end,
    tags = function(tags) return { man_made = tags.man_made } end,
    tags_cc = { 'network', 'ref' },
  }),
  class_obstacle_category.new({
    id = 'collision_protection',
    buffer_radius = function(tags) return 0.4 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.barrier == 'collision_protection'
    end,
    tags = function(tags) return { barrier = tags.barrier } end,
    tags_cc = {},
  }),
}
