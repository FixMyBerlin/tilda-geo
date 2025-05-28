require('init')
require('sanitize_for_logging')
local helper = require('obstacle_point_categories_helper')
require('class_obstacle_category')
require('two_wheel_parking_helper')
require('amenity_parking_helper')
local TAG_HELPER = require('tag_helper')


obstacle_point_categories = {
  class_obstacle_category.new({
    id = 'bollard',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return 0.3 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.barrier == 'bollard'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'barrier', 'access' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'street_lamp',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return 0.4 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.highway == 'street_lamp'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'highway', 'ref' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'tree',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return 1.5 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and (tags.natural == 'tree' or tags.natural == 'tree_stump')
    end,
    tags = function(tags) return { natural = sanitize_for_logging(tags.natural, { 'tree', 'tree_stump' }) } end,
    tags_cc = { 'natural', 'ref' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'street_cabinet', -- https://wiki.openstreetmap.org/wiki/Tag:man_made%3Dstreet_cabinet
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return 1.5 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.man_made == 'street_cabinet'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'street_cabinet' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'advertising', -- https://wiki.openstreetmap.org/wiki/Key:traffic_sign
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return 0.3 end,
    conditions = function(tags)
      -- highway=traffic_sign is not used a lot but a way to describe a unspecified sign
      return TAG_HELPER.is_obstacle_parking(tags) and (tags.traffic_sign ~= nil or tags.highway == 'traffic_sign')
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'traffic_sign', 'highway' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'turning_circle', -- https://wiki.openstreetmap.org/wiki/DE:Tag:highway%3Dturning_circle
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return 10 end,
    conditions = function(tags)
      return tags['highway'] == 'turning_circle'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'ref' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'turning_loop', -- https://wiki.openstreetmap.org/wiki/DE:Tag:highway%3Dturning_loop
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return 15 end,
    conditions = function(tags)
      return tags['highway'] == 'turning_loop'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'ref' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'bus_stop', -- https://wiki.openstreetmap.org/wiki/DE:Tag:highway%3Dbus_stop
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return 15 end,
    conditions = function(tags)
      return tags['highway'] == 'bus_stop'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'ref' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'crossing_zebra',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'side',
    perform_buffer = function(tags) return 4.5 end,
    conditions = function(tags)
      return tags['crossing'] == 'zebra' or tags['crossing_ref'] == 'zebra' or tags['crossing:markings'] == 'zebra'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'crossing', 'crossing_ref', 'crossing:markings', 'crossing:buffer_marking', 'crossing:kerb_extension' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'crossing_marked',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'side',
    perform_buffer = function(tags) return 2 end,
    conditions = function(tags)
      return tags['crossing'] == 'marked'
    end,
    tags = function(tags) return {} end,
    tags_cc = {},
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'crossing_buffer_marking',
    side_schema = 'side_value',
    side_key = 'crossing:buffer_marking',
    perform_snap = 'side',
    perform_buffer = function(tags) return 3 end,
    conditions = function(tags)
      return helper.has_side_value(tags['crossing:buffer_marking'])
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'crossing', 'crossing_ref', 'crossing:markings', 'crossing:buffer_marking', 'crossing:kerb_extension' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'crossing_kerb_extension',
    side_schema = 'side_value',
    side_key = 'crossing:kerb_extension',
    perform_snap = 'side',
    perform_buffer = function(tags) return 3 end,
    conditions = function(tags)
      return helper.has_side_value(tags['crossing:kerb_extension'])
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'crossing', 'crossing_ref', 'crossing:markings', 'crossing:buffer_marking', 'crossing:kerb_extension' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    -- https://overpass-turbo.eu/s/24o4
    -- Examples: https://www.openstreetmap.org/node/7580579485, https://www.openstreetmap.org/node/7580552984
    --
    id = 'traffic_calming_choker', -- 'direction_key' variant
    side_schema = 'direction_key',
    side_key = '_side_key_traffic_calming', -- see `transform_point_direction_tags.lua`
    perform_snap = 'side',
    perform_buffer = function(tags) return 3 end,
    conditions = function(tags)
      -- no additional conditions; side_schema=direction_key will transform the tags; a missing `direction=forward|…` key is treated as "both".
      return tags['traffic_calming'] == 'choker'
    end,
    tags = function(tags) return { traffic_calming = tags.traffic_calming, direction = tags.direction } end,
    tags_cc = { 'crossing', 'crossing_ref', 'crossing:markings', 'crossing:buffer_marking', 'crossing:kerb_extension' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    -- https://overpass-turbo.eu/s/24o4
    -- Examples: https://www.openstreetmap.org/node/5405508818
    id = 'traffic_calming_choker', -- 'side_suffix' variant
    side_schema = 'side_suffix',
    side_key = 'traffic_calming',
    perform_snap = 'side',
    perform_buffer = function(tags) return 3 end,
    conditions = function(tags)
      return helper.check_tag_with_suffixes(tags, 'traffic_calming', 'choker')
    end,
    tags = function(tags) return { traffic_calming = 'choker' } end,
    tags_cc = { 'crossing', 'crossing_ref', 'crossing:markings', 'crossing:buffer_marking', 'crossing:kerb_extension' },
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'loading_ramp',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return 2 end,
    conditions = function(tags) return tags.amenity == 'loading_ramp' end,
    tags = function(tags) return { amenity = 'loading_ramp',  operator = tags.operator } end,
    tags_cc = {},
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'bicycle_parking',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return two_wheel_parking_buffer(tags) end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'bicycle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'bicycle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('bicycle_parking'),
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'motorcycle_parking',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return two_wheel_parking_buffer(tags) end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'motorcycle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'motorcycle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('motorcycle_parking'),
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'small_electric_vehicle_parking',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    -- Fixed buffer of 5m because SEV don't hava a capacity so our capacity based width does not work
    perform_buffer = function(tags) return 5 end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'small_electric_vehicle_parking') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'small_electric_vehicle_parking') end,
    tags_cc = two_wheel_parking_tags_cc('small_electric_vehicle_parking'),
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'bicycle_rental',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return two_wheel_parking_buffer(tags) end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'bicycle_rental') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'bicycle_rental') end,
    tags_cc = two_wheel_parking_tags_cc('bicycle_rental'),
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'mobility_hub',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return two_wheel_parking_buffer(tags) end,
    conditions = function(tags) return two_wheel_parking_conditions(tags, 'mobility_hub') end,
    tags = function(tags) return two_wheel_parking_tags(tags, 'mobility_hub') end,
    tags_cc = two_wheel_parking_tags_cc('mobility_hub'),
    apply_parking_capacity_fallback = false,
  }),
  -- TODO Do those make sense? I think we can remove them…
  --
  -- class_obstacle_category.new({
  --   id = 'parking_lane',
  --   side_schema = nil,
  --   side_key = nil,
  --   perform_snap = 'self',
  --   perform_buffer = function(tags) return amenity_parking_point_buffer(tags) end,
  --   conditions = function(tags)
  --     return tags['amenity'] == 'parking' and tags['parking'] == 'lane'
  --   end,
  --   tags = function(tags) return amenity_parking_tags(tags) end,
  --   tags_cc = amenity_parking_tags_cc(),
  --   apply_parking_capacity_fallback = false,
  -- }),
  -- class_obstacle_category.new({
  --   id = 'parking_street_side',
  --   side_schema = nil,
  --   side_key = nil,
  --   perform_snap = 'self',
  --   perform_buffer = function(tags) return amenity_parking_point_buffer(tags) end,
  --   conditions = function(tags)
  --     return tags['amenity'] == 'parking' and tags['parking'] == 'street_side'
  --   end,
  --   tags = function(tags) return amenity_parking_tags(tags) end,
  --   tags_cc = amenity_parking_tags_cc(),
  --   apply_parking_capacity_fallback = false,
  -- }),
  class_obstacle_category.new({
    id = 'recycling',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return tags.width or 5 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.amenity == 'recycling'
    end,
    tags = function(tags) return { amenity = tags.amenity } end,
    tags_cc = {},
    apply_parking_capacity_fallback = false,
  }),
  class_obstacle_category.new({
    id = 'vending_parking_tickets',
    side_schema = nil,
    side_key = nil,
    perform_snap = 'self',
    perform_buffer = function(tags) return 1 end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and tags.amenity == 'vending_machine'
    end,
    tags = function(tags) return { amenity = tags.amenity } end,
    tags_cc = { 'vending', 'zone' },
    apply_parking_capacity_fallback = false,
  }),
}
