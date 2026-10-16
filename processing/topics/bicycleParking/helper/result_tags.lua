local sanitize_traffic_sign = require('topics.helper.sanitize_traffic_sign')
local extract_public_tags = require('topics.helper.extract_public_tags')
local S = require('topics.bicycleParking.sanitize_bicycle_parking_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')

--- Tags shared by all parts of an object. `kind` and `capacity` are set per part (see kind_parts.lua).
local function result_tags_bicycle_parking(tags)
  local result_tags = {
    access = S.access(tags.access),
    covered = S.covered(tags.covered),
    fee = S.fee(tags.fee),
    access_cargo_bike = S.cargo_bike(tags.cargo_bike),
    lit = S.lit(tags.lit),
    stand_type = S.stand_type(tags.bicycle_parking),
    rental_type = S.rental_type(tags.bicycle_rental),
    name = SANITIZE_TAGS.safe_string(tags.name),
    operator = SANITIZE_TAGS.safe_string(tags.operator),
    operator_type = SANITIZE_TAGS.operator_type(tags),
    network = SANITIZE_TAGS.safe_string(tags.network),
    mapillary = SANITIZE_TAGS.safe_string(tags.mapillary),
    description = SANITIZE_TAGS.safe_string(tags.description),
    traffic_sign = sanitize_traffic_sign(tags.traffic_sign),
    count = tonumber(tags['bicycle_parking:count']),
    position = S.position(tags),
    indoor = SANITIZE_TAGS.indoor(tags.indoor),
    maxstay = SANITIZE_TAGS.safe_string(tags.maxstay),
    surface = SANITIZE_TAGS.surface(tags),
    surveillance = S.surveillance(tags.surveillance),
    -- Never in the output: `capacity` is set per part. A value that is not a number is reported as an error.
    capacity = S.capacity_check(tags.capacity),
    ['capacity:cargo_bike'] = S.capacity_check(tags['capacity:cargo_bike']),
  }

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(
    public_result_tags,
    tags,
    S.log_source_overrides(tags)
  )
end

return result_tags_bicycle_parking
