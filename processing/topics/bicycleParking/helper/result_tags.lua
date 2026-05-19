local sanitize_traffic_sign = require('topics.helper.sanitize_traffic_sign')
local merge_table = require('topics.helper.merge_table')
local extract_public_tags = require('topics.helper.extract_public_tags')
local capacity_normalization = require('topics.helper.capacity_normalization')
local S = require('topics.bicycleParking.sanitize_bicycle_parking_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')

local function result_tags_bicycle_parking(tags)
  local result_tags = {
    access = S.access(tags.access),
    covered = S.covered(tags.covered),
    fee = S.fee(tags.fee),
    access_cargo_bike = S.cargo_bike(tags.cargo_bike),
    lit = S.lit(tags.lit),
    bicycle_parking = S.bicycle_parking(tags.bicycle_parking),
    name = SANITIZE_TAGS.safe_string(tags.name),
    operator = SANITIZE_TAGS.safe_string(tags.operator),
    operator_type = SANITIZE_TAGS.operator_type(tags),
    mapillary = SANITIZE_TAGS.safe_string(tags.mapillary),
    description = SANITIZE_TAGS.safe_string(tags.description),
    traffic_sign = sanitize_traffic_sign(tags.traffic_sign),
    count = tonumber(tags['bicycle_parking:count']),
    position = S.bicycle_parking_position(tags),
    indoor = SANITIZE_TAGS.indoor(tags.indoor),
    maxstay = SANITIZE_TAGS.safe_string(tags.maxstay),
    surface = SANITIZE_TAGS.surface(tags),
    surveillance = S.surveillance(tags.surveillance),
    -- Keep raw OSM values for `osm_*` fields unchanged.
    osm_capacity = SANITIZE_TAGS.safe_string(tags.capacity),
    ['osm_capacity:cargo_bike'] = SANITIZE_TAGS.safe_string(tags['capacity:cargo_bike']),
  }

  local capacity_tags = capacity_normalization(tags)
  merge_table(result_tags, capacity_tags)

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(
    public_result_tags,
    tags,
    S.log_source_overrides(tags)
  )
end

return result_tags_bicycle_parking
