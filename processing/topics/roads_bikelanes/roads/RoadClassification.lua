require('init')
require("Set")
require("CopyTags")
require("Sanitize")
require("DeriveTrafficSigns")
local parse_length = require('parse_length')
require("MergeTable")
require("RoadClassificationRoadValue")

local tags_copied = {
  "mapillary",
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


  if tags.oneway == 'yes' then
    -- Note: We do not pass 'oneway=no' to the 'road_oneway' key
    -- because it is the default which we do not want to show in the UI.
    result_tags.road_oneway = tags.oneway
    if tags.dual_carriageway == "yes" then
      result_tags.road_oneway = tags.oneway .. '_dual_carriageway'
    end
  end
  if tags['oneway:bicycle'] == 'no' or tags['oneway:bicycle'] then
    result_tags['road_oneway:bicycle'] = tags['oneway:bicycle']
  end

  CopyTags(result_tags, tags, tags_copied)
  CopyTags(result_tags, tags, tags_prefixed, "osm_")
  result_tags.width = parse_length(tags.width)
  result_tags.oneway = Sanitize(tags.oneway, { "yes", "no" })
  result_tags.bridge = Sanitize(tags.bridge, { "yes" })
  result_tags.tunnel = Sanitize(tags.tunnel, { "yes" })
  MergeTable(result_tags, DeriveTrafficSigns(tags))

  return result_tags
end
