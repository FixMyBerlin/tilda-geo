require('init')
require("Set")
require("CopyTags")
require("Sanitize")
require("DeriveTrafficSigns")
local parse_length = require('parse_length')
require("MergeTable")
require("RoadClassificationRoadValue")

local tags_copied = {
  "description",
}
local tags_prefixed = {}

function RoadClassification(object)
  local tags = object.tags
  local result_tags = {
    road = RoadClassificationRoadValue(object.tags)
  }

  -- Mischverkehr
  -- INFO: Deactivated for now. Not needed during styling and buggy ATM.
  -- if tags.bicycle ~= 'no' and tags.bicycle ~= 'use_sidepath' then
  --   if MinorRoadClasses[tags.highway] or MajorRoadClasses[tags.highway] then
  --     roadClassification.road_implicit_shared_lane = true
  --   end
  -- end

  -- Note: We do not pass 'oneway=no' to the 'oneway' key
  -- because it is the default which we do not want to show in the UI.
  result_tags.oneway = Sanitize(tags.oneway, { "yes" })
  if tags.oneway == 'yes' and tags.dual_carriageway == 'yes' then
    result_tags.oneway = 'yes_dual_carriageway'
  end
  if tags['oneway:bicycle'] then
    result_tags['oneway_bicycle'] = Sanitize(tags['oneway:bicycle'], { 'yes', 'no' })
  end

  CopyTags(result_tags, tags, tags_copied)
  CopyTags(result_tags, tags, tags_prefixed, "osm_")
  result_tags.width = parse_length(tags.width)
  result_tags.bridge = Sanitize(tags.bridge, { "yes" })
  result_tags.tunnel = Sanitize(tags.tunnel, { "yes" })
  MergeTable(result_tags, DeriveTrafficSigns(tags))

  return result_tags
end
