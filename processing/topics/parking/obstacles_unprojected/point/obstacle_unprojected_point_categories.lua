require('init')
require('class_obstacle_category')

obstacle_unprojected_point_categories = {
  class_obstacle_category.new({
    id = 'turning_circle', -- https://wiki.openstreetmap.org/wiki/DE:Tag:highway%3Dturning_circle
    buffer_radius = function(tags) return 10 end,
    conditions = function(tags)
      return tags['highway'] == 'turning_circle'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'ref' },
  }),
  class_obstacle_category.new({
    id = 'turning_loop', -- https://wiki.openstreetmap.org/wiki/DE:Tag:highway%3Dturning_loop
    buffer_radius = function(tags) return 15 end,
    conditions = function(tags)
      return tags['highway'] == 'turning_loop'
    end,
    tags = function(tags) return {} end,
    tags_cc = { 'ref' },
  }),
}
