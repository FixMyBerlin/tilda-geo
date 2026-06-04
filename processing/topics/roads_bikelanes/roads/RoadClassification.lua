require('init')
require('Set')
require('Sanitize')
require('DeriveTrafficSigns')
local sanitize_cleaner = require('sanitize_cleaner')
local SANITIZE_TAGS = require('sanitize_tags')
local parse_width = require('parse_width')
require('MergeTable')
require('RoadClassificationRoadValue')

function RoadClassification(object_tags, object)
  local width = nil
  local width_confidence = nil

  if object_tags.width then
    local parsed = parse_width(object_tags.width, object, 'width')
    if parsed then
      width = parsed
      width_confidence = "high"
    end
  end

  if not width and object_tags.est_width then
    local parsed = parse_width(object_tags.est_width, object, 'est_width')
    if parsed then
      width = parsed
      width_confidence = "low"
    end
  end

  local result_tags = {
    road = RoadClassificationRoadValue(object_tags),
    oneway = SANITIZE_TAGS.oneway_road(object_tags),
    oneway_bicycle = SANITIZE_TAGS.oneway_bicycle(object_tags['oneway:bicycle']),
    width = width,
    width_confidence = width_confidence,
    width_source = SANITIZE_TAGS.safe_string(object_tags['source:width']),
    width_effective = parse_width(object_tags['width:effective'], object, 'width:effective'),
    bridge = SANITIZE_TAGS.boolean_yes(object_tags.bridge),
    tunnel = SANITIZE_TAGS.boolean_yes(object_tags.tunnel),
  }

  MergeTable(result_tags, DeriveTrafficSigns(object_tags))

  local cleaned_tags = sanitize_cleaner.remove_disallowed_values(result_tags)
  return cleaned_tags
end
