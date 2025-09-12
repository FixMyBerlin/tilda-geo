require('init')
require('Set')
require('Sanitize')
require('DeriveTrafficSigns')
local sanitize_cleaner = require('sanitize_cleaner')
local SANITIZE_TAGS = require('sanitize_tags')
local parse_length = require('parse_length')
require('MergeTable')
require('RoadClassificationRoadValue')

function RoadClassification(object_tags)
  local result_tags = {
    road = RoadClassificationRoadValue(object_tags),
    oneway = SANITIZE_TAGS.oneway_road(object_tags),
    oneway_bicycle = SANITIZE_TAGS.oneway_bicycle(object_tags['oneway:bicycle']),
    width = parse_length(object_tags.width),
    width_source = SANITIZE_TAGS.safe_string(object_tags['source:width']),
    bridge = SANITIZE_TAGS.boolean_yes(object_tags.bridge),
    tunnel = SANITIZE_TAGS.boolean_yes(object_tags.tunnel),
  }

  MergeTable(result_tags, DeriveTrafficSigns(object_tags))

  local cleaned_tags = sanitize_cleaner.remove_disallowed_values(result_tags)
  return cleaned_tags
end
