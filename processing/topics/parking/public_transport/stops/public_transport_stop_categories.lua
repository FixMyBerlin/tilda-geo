require('init')
require('class_public_transport_category')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')

public_transport_stop_categories = {
  class_public_transport_category.new({
    id = 'bus_stop_conditional', -- https://overpass-turbo.eu/s/25Z1
    buffer_radius = 15,
    conditions = function(tags)
      return tags.highway == 'bus_stop' and tags.opening_hours ~= nil
    end,
    tags = function(tags)
      return {
        name = SANITIZE_TAGS.safe_string(tags.name),
        ref = SANITIZE_TAGS.safe_string(tags.ref),
        opening_hours = SANITIZE_TAGS.safe_string(tags.opening_hours),
        side = SANITIZE_PARKING_TAGS.direction_to_side(tags.direction),
      }
    end,
  }),
  class_public_transport_category.new({
    -- There are two ways to map bus stops (in Berlin) AMT.
    -- This one has the representation of the bus stop sign on the centerline.
    -- We later snap this to the platform line to move it to the right _side_ where we then create the cutout.
    -- The platform is mostly right next to the kerb to we can use this location for the cutout as is.
    -- This schema is similar to https://wiki.openstreetmap.org/wiki/Proposal:Refined_Public_Transport#Main_Object
    id = 'bus_stop_centerline',
    buffer_radius = 15,
    conditions = function(tags)
      return tags.highway == 'bus_stop' and tags.public_transport == 'stop_position' and tags.bus == 'yes' and tags.opening_hours == nil
    end,
    tags = function(tags)
      return {
        name = SANITIZE_TAGS.safe_string(tags.name),
        ref = SANITIZE_TAGS.safe_string(tags.ref),
        side = SANITIZE_PARKING_TAGS.direction_to_side(tags.direction),
      }
    end,
  }),
  class_public_transport_category.new({
    -- This one has the representation of the bus stop sign as a node on the platform.
    -- As such it's geometry already represents the right side and we snap it to the kerb.
    -- https://wiki.openstreetmap.org/wiki/DE:Tag:highway%3Dbus_stop
    id = 'bus_stop_kerb',
    buffer_radius = 15,
    conditions = function(tags)
      return tags.highway == 'bus_stop' and tags.opening_hours == nil
    end,
    tags = function(tags)
      return {
        name = SANITIZE_TAGS.safe_string(tags.name),
        ref = SANITIZE_TAGS.safe_string(tags.ref),
        side = SANITIZE_PARKING_TAGS.direction_to_side(tags.direction),
      }
    end,
  }),
  class_public_transport_category.new({
    id = 'tram_stop_v2', -- https://wiki.openstreetmap.org/wiki/DE:Tag:railway%3Dtram_stop
    buffer_radius = 15,
    conditions = function(tags)
      return tags['railway'] == 'tram_stop' and tags.opening_hours == nil
    end,
    tags = function(tags)
      return {
        name = SANITIZE_TAGS.safe_string(tags.name),
        ref = SANITIZE_TAGS.safe_string(tags.ref),
      }
    end,
  }),
}

return public_transport_stop_categories
