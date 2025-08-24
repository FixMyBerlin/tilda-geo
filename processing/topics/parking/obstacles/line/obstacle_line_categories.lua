require('init')
require('class_obstacle_category')
require('two_wheel_parking_helper')
require('Log')
local TAG_HELPER = require('tag_helper')

obstacle_line_categories = {
  class_obstacle_category.new({
    id = 'kerb_lowered', -- https://www.openstreetmap.org/way/814637433
    buffer_radius = function(tags) return nil end,
    conditions = function(tags)
      return tags.barrier == 'kerb' and (tags.kerb == 'lowered' or tags.kerb == 'flush')
    end,
    tags = function(tags) return {
      barrier = tags.barrier,
      kerb = tags.kerb
    } end,
    tags_cc = {},
  }),
  class_obstacle_category.new({
    id = 'barrier',
    buffer_radius = function(tags) return nil end,
    conditions = function(tags)
      return TAG_HELPER.is_obstacle_parking(tags) and (
        tags.barrier == 'bollard' or -- https://www.openstreetmap.org/way/889059815
        tags.barrier == 'fence' -- https://www.openstreetmap.org/way/777325759
      )
    end,
    tags = function(tags) return { barrier = tags.barrier } end,
    tags_cc = {},
  }),
  -- class_obstacle_category.new({
  --   id = 'path',
  --   buffer_radius = function(tags) return nil end,
  --   conditions = function(tags)
  --     return TAG_HELPER.is_obstacle_parking(tags) and (
  --       tags.highway
  --     )
  --   end,
  --   tags = function(tags) return { barrier = tags.barrier } end,
  --   tags_cc = {},
  -- }),
}
