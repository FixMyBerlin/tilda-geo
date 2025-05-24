require('init')
require("capacity_normalization")
require("sanitize_for_logging")
require("MergeTable")
require("Log")

function two_wheel_parking_buffer(tags)
  local fallback = 0.5
  if tags == nil then return fallback end
  if not tags.capacity then return fallback end

  local full_capacity = tonumber(tags.capacity)
  if full_capacity then
    return full_capacity / 2 * 1.6
  end
  return fallback
end

function two_wheel_parking_tags(tags, value)
  return MergeTable({ amenity = sanitize_for_logging(tags.amenity, { value }) }, capacity_normalization(tags))
end

function two_wheel_parking_tags_cc(value)
  return { value..":position", "position", "capacity" }
end

function two_wheel_parking_conditions(tags, value)
  return tags.amenity == value and (
    tags[value..":position"] == "lane" or
    tags[value..":position"] == "street_side" or
    tags[value..":position"] == "shoulder" or
    tags[value..":position"] == "kerb_extension" or
    tags["position"] == "lane" or
    tags["position"] == "street_side" or
    tags["position"] == "shoulder" or
    tags["position"] == "kerb_extension" or
    tags["parking"] == "lane" or
    tags["parking"] == "street_side" or
    tags["parking"] == "shoulder" or
    tags["parking"] == "kerb_extension"
  )
end
