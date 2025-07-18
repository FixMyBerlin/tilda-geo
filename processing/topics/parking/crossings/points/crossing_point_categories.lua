require('init')
require('class_crossing_category')
local helper = require('crossing_point_categories_helper')

local crossing_point_categories = {
  class_crossing_category.new({
    id = 'crossing_traffic_signals',
    side_schema = 'none',
    side_key = nil,
    buffer_radius = function(tags) return 2 end,
    conditions = function(tags)
      return tags['crossing'] == 'traffic_signals' or tags['crossing:signals'] == 'yes'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'crossing', 'crossing:signals', 'crossing:markings', 'crossing:buffer_marking', 'crossing:kerb_extension' },
  }),
  class_crossing_category.new({
    id = 'crossing_zebra',
    side_schema = 'none',
    side_key = nil,
    buffer_radius = function(tags) return 4.5 end,
    conditions = function(tags)
      return tags['crossing'] == 'zebra' or tags['crossing_ref'] == 'zebra' or tags['crossing:markings'] == 'zebra'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'crossing', 'crossing_ref', 'crossing:markings', 'crossing:buffer_marking', 'crossing:kerb_extension' },
  }),
  class_crossing_category.new({
    id = 'crossing_marked',
    side_schema = 'none',
    side_key = nil,
    buffer_radius = function(tags) return 2 end,
    conditions = function(tags)
      return tags['crossing'] == 'marked'
    end,
    tags = function(tags) return {} end,
    tags_cc = {},
  }),
  class_crossing_category.new({
    id = 'crossing_buffer_marking',
    side_schema = 'side_value',
    side_key = 'crossing:buffer_marking',
    buffer_radius = function(tags) return 3 end,
    conditions = function(tags)
      return helper.has_side_value(tags['crossing:buffer_marking'])
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'crossing', 'crossing_ref', 'crossing:markings', 'crossing:buffer_marking', 'crossing:kerb_extension' },
  }),
  class_crossing_category.new({
    id = 'crossing_kerb_extension',
    side_schema = 'side_value',
    side_key = 'crossing:kerb_extension',
    buffer_radius = function(tags) return 3 end,
    conditions = function(tags)
      return helper.has_side_value(tags['crossing:kerb_extension'])
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'crossing', 'crossing_ref', 'crossing:markings', 'crossing:buffer_marking', 'crossing:kerb_extension' },
  }),
  class_crossing_category.new({
    -- https://overpass-turbo.eu/s/24o4
    -- Examples: https://www.openstreetmap.org/node/7580579485, https://www.openstreetmap.org/node/7580552984
    --
    id = 'traffic_calming_choker', -- 'direction_key' variant
    side_schema = 'direction_key',
    side_key = '_side_key_traffic_calming', -- see `transform_point_direction_tags.lua`
    buffer_radius = function(tags) return 3 end,
    conditions = function(tags)
      -- no additional conditions; side_schema=direction_key will transform the tags; a missing `direction=forward|…` key is treated as "both".
      return tags['traffic_calming'] == 'choker'
    end,
    tags = function(tags) return { traffic_calming = tags.traffic_calming, direction = tags.direction } end,
    tags_cc = { 'crossing', 'crossing_ref', 'crossing:markings', 'crossing:buffer_marking', 'crossing:kerb_extension' },
  }),
  class_crossing_category.new({
    -- https://overpass-turbo.eu/s/24o4
    -- Examples: https://www.openstreetmap.org/node/5405508818
    id = 'traffic_calming_choker', -- 'side_suffix' variant
    side_schema = 'side_suffix',
    side_key = 'traffic_calming',
    buffer_radius = function(tags) return 3 end,
    conditions = function(tags)
      return helper.check_tag_with_suffixes(tags, 'traffic_calming', 'choker')
    end,
    tags = function(tags) return { traffic_calming = 'choker' } end,
    tags_cc = { 'crossing', 'crossing_ref', 'crossing:markings', 'crossing:buffer_marking', 'crossing:kerb_extension' },
  }),
}

return crossing_point_categories
