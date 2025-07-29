require('init')
require("DeriveSurface")
require("DeriveSmoothness")
local SANITIZE_ROAD_TAGS = require('sanitize_road_tags')

function SurfaceQuality(object_tags)
  local result_tags = {}

  MergeTable(result_tags, DeriveSurface(object_tags))
  MergeTable(result_tags, DeriveSmoothness(object_tags))
  result_tags.surface_color = SANITIZE_ROAD_TAGS.surface_color(object_tags)

  return result_tags
end
