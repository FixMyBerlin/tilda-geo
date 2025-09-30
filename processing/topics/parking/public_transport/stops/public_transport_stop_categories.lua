require('init')
require('class_public_transport_category')
local SANITIZE_TAGS = require('sanitize_tags')

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
      }
    end,
  }),
  class_public_transport_category.new({
    id = 'bus_stop_v3', -- https://wiki.openstreetmap.org/wiki/Proposal:Refined_Public_Transport#Main_Object
    buffer_radius = 15,
    conditions = function(tags)
      return tags.highway == 'bus_stop' and tags.public_transport == 'stop_position' and tags.bus == 'yes' and tags.opening_hours == nil
    end,
    tags = function(tags)
      return {
        name = SANITIZE_TAGS.safe_string(tags.name),
        ref = SANITIZE_TAGS.safe_string(tags.ref),
      }
    end,
  }),
  class_public_transport_category.new({
    id = 'bus_stop_v2', -- https://wiki.openstreetmap.org/wiki/DE:Tag:highway%3Dbus_stop
    buffer_radius = 15,
    conditions = function(tags)
      return tags.highway == 'bus_stop' and tags.opening_hours == nil
    end,
    tags = function(tags)
      return {
        name = SANITIZE_TAGS.safe_string(tags.name),
        ref = SANITIZE_TAGS.safe_string(tags.ref),
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
