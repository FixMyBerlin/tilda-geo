local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local extract_public_tags = require('topics.helper.extract_public_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')

-- Bike sharing and bike rental (`amenity|tourism|leisure=bicycle_rental`), stored next to the
-- bicycle parking in `bicycleParking_rental`. A separate table so the readers of
-- `bicycleParking_points` (calculator, measure, export, Flächenfinder existing supply)
-- do not count rental stations as parking.
local BICYCLE_RENTAL = {}

---@param tags OsmTags
---@return boolean
function BICYCLE_RENTAL.is_bicycle_rental(tags)
  return tags.amenity == 'bicycle_rental'
    or tags.tourism == 'bicycle_rental'
    or tags.leisure == 'bicycle_rental'
end

---@param tags OsmTags
---@return table, table
function BICYCLE_RENTAL.result_tags(tags)
  local result_tags = {
    category = 'bicycle_rental',
    -- Kind of station: `docking_station`, `dropoff_point`, `shop`, …
    bicycle_rental = SANITIZE_TAGS.safe_string(tags.bicycle_rental),
    name = SANITIZE_TAGS.safe_string(tags.name),
    operator = SANITIZE_TAGS.safe_string(tags.operator),
    network = SANITIZE_TAGS.safe_string(tags.network),
    capacity = tonumber(tags.capacity),
    osm_capacity = SANITIZE_TAGS.safe_string(tags.capacity),
  }

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, tags, {})
end

return BICYCLE_RENTAL
