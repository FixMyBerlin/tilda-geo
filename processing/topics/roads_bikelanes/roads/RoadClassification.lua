require('init')
require("Set")
require("Sanitize")
require("DeriveTrafficSigns")
local parse_length = require('parse_length')
require("MergeTable")
require("RoadClassificationRoadValue")

function RoadClassification(object_tags)
  local result_tags = {
    road = RoadClassificationRoadValue(object_tags)
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
  result_tags.oneway = Sanitize(object_tags.oneway, { "yes" })
  if object_tags.oneway == 'yes' and object_tags.dual_carriageway == 'yes' then
    result_tags.oneway = 'yes_dual_carriageway'
  end
  if object_tags['oneway:bicycle'] then
    result_tags['oneway_bicycle'] = Sanitize(object_tags['oneway:bicycle'], { 'yes', 'no' })
  end

  result_tags.width = parse_length(object_tags.width)
  result_tags.width_source = object_tags['source:width']
  result_tags.bridge = Sanitize(object_tags.bridge, { "yes" })
  result_tags.tunnel = Sanitize(object_tags.tunnel, { "yes" })
  MergeTable(result_tags, DeriveTrafficSigns(object_tags))

  return result_tags
end
