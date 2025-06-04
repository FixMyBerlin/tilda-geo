require('init')
require('class_crossing_category')
require('Log')

crossing_line_categories = {
  class_crossing_category.new({
    id = 'crossing_zebra_way',
    side_schema = 'none',
    side_key = nil,
    perform_buffer = function(tags) return nil end,
    conditions = function(tags)
      return tags.highway and (
        tags.footway == 'crossing' or
        tags.cycleway == 'crossing' or
        tags.path == 'crossing'
      ) and (
        tags['crossing'] == 'zebra' or
        tags['crossing_ref'] == 'zebra' or
        tags['crossing:markings'] == 'zebra'
      )
    end,
    tags = function(tags)
      return {
        highway = tags.highway,
        footway = tags.footway,
        cycleway = tags.cycleway,
        path = tags.path,
      }
    end,
    tags_cc = {},
  }),
  class_crossing_category.new({
    id = 'crossing_table_way',
    side_schema = 'none',
    side_key = nil,
    perform_buffer = function(tags) return nil end,
    conditions = function(tags)
      return tags.highway and (
        tags.footway == 'crossing' or
        tags.cycleway == 'crossing' or
        tags.path == 'crossing'
      ) and (
        tags['traffic_calming'] == 'table'
      )
    end,
    tags = function(tags)
      return {
        highway = tags.highway,
        footway = tags.footway,
        cycleway = tags.cycleway,
        path = tags.path,
        traffic_calming = tags.traffic_calming,
      }
    end,
    tags_cc = {},
  }),
  class_crossing_category.new({
    id = 'crossing_way',
    side_schema = 'none',
    side_key = nil,
    perform_buffer = function(tags) return nil end,
    conditions = function(tags)
      return tags.highway and (
        tags.footway == 'crossing' or
        tags.cycleway == 'crossing' or
        tags.path == 'crossing'
      )
    end,
    tags = function(tags)
      return {
        highway = tags.highway,
        footway = tags.footway,
        cycleway = tags.cycleway,
        path = tags.path,
      }
    end,
    tags_cc = {},
  }),
}

return crossing_line_categories
