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

  -- 77,000+ https://taginfo.openstreetmap.org/keys/check_date%3Asurface
  -- result_tags._surface_age = AgeInDays(ParseCheckDate(tags["check_date:surface"]))
  -- 4,000+ https://taginfo.openstreetmap.org/keys/check_date%3Asmoothness
  -- result_tags._smoothness_age = AgeInDays(ParseCheckDate(tags["check_date:smoothness"]))

  CopyTags(result_tags, tags, tags_copied)
  CopyTags(result_tags, tags, tags_prefixed, "osm_")

  return result_tags
end
