require('init')
require("TimeUtils")
require("DeriveSurface")
require("DeriveSmoothness")
require("Set")
require("CopyTags")
local SANITIZE_ROAD_TAGS = require('sanitize_road_tags')

local tags_copied = {}
local tags_prefixed = {}

function SurfaceQuality(object)
  local tags = object.tags
  local result_tags = {}

  MergeTable(result_tags, DeriveSurface(tags))
  MergeTable(result_tags, DeriveSmoothness(tags))
  result_tags.surface_color = SANITIZE_ROAD_TAGS.surface_color(tags)

  CopyTags(result_tags, tags, tags_copied)
  CopyTags(result_tags, tags, tags_prefixed, "osm_")

  return result_tags
end
