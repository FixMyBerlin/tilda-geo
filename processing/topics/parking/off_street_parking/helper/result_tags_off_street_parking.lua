require('init')
require("DefaultId")
require("Metadata")
require("Log")
local parse_capacity = require('parse_capacity')
local sanitize_cleaner = require('sanitize_cleaner')
local classify_parking_conditions = require('classify_parking_conditions')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')

local function result_tags_off_street_parking(result, area)
  local id = DefaultId(result.object)

  local capacity_from_tag, capacity_source_from_tag, capacity_confidence_from_tag = parse_capacity(result.object.tags)
  local surface_tags = {
    value = SANITIZE_TAGS.surface(result.object.tags),
    confidence = 'high',
    source = result.object.tags.surface == SANITIZE_TAGS.surface(result.object.tags) and 'tag' or 'tag_transformed',
  }
  local conditional_categories_tags = classify_parking_conditions.classify_parking_conditions(result.object.tags, 'private')

  -- Get capacity from category (handles both tag-based and area-based capacity)
  local capacity_from_category = nil
  local capacity_source_from_category = nil
  local capacity_confidence_from_category = nil
  if area ~= nil then
    local category_capacity = result.category:get_capacity(result.object.tags, area)
    if category_capacity then
      capacity_from_category = category_capacity.capacity
      capacity_source_from_category = category_capacity.capacity_source
      capacity_confidence_from_category = category_capacity.capacity_confidence
    end
  end

  -- Use tag-based capacity if available, otherwise use category capacity
  local capacity = capacity_from_tag or capacity_from_category
  local capacity_source = capacity_source_from_tag or capacity_source_from_category
  local capacity_confidence = capacity_confidence_from_tag or capacity_confidence_from_category

  -- CRITICAL: Keep these lists in sync:
  -- 1. `result_tags` in `processing/topics/parking/parkings/helper/result_tags_parkings.lua`
  -- 2. `result_tags` in `processing/topics/parking/separate_parkings/helper/result_tags_separate_parking.lua`
  -- 3. `result_tags` in `processing/topics/parking/off_street_parking/helper/result_tags_off_street_parking.lua`
  -- 4. `jsonb_build_object` in `processing/topics/parking/4_merge_parkings.sql` (if applicable for off-street)
  local result_tags = {
    side = nil,
    source = nil, -- Not used (no centroid/centerofmass processing)

    -- Road properties (not applicable for off-street parking, kept for structure comparison)
    road = nil,
    road_name = nil,
    road_width = nil,
    road_width_confidence = nil,
    road_width_source = nil,
    road_oneway = nil,
    operator_type = SANITIZE_TAGS.operator_type(result.object.tags),
    mapillary = SANITIZE_TAGS.safe_string(result.object.tags.mapillary),

    -- Capacity & Area
    capacity = capacity,
    capacity_source = capacity_source,
    capacity_confidence = capacity_confidence,
    area = area,
    area_confidence = area ~= nil and 'high' or nil,
    area_source = area ~= nil and 'geometry' or nil,

    -- Parking properties
    condition_category = conditional_categories_tags.condition_category,
    condition_vehicles = conditional_categories_tags.condition_vehicles,
    covered = SANITIZE_TAGS.covered(result.object.tags.covered),
    direction = SANITIZE_PARKING_TAGS.direction(result.object.tags.direction),
    fee = SANITIZE_PARKING_TAGS.fee(result.object.tags.fee),
    informal = SANITIZE_TAGS.informal(result.object.tags.informal),
    location = SANITIZE_PARKING_TAGS.location(result.object.tags.location),
    markings = SANITIZE_PARKING_TAGS.markings(result.object.tags.markings),
    orientation = SANITIZE_PARKING_TAGS.orientation(result.object.tags.orientation),
    parking = SANITIZE_PARKING_TAGS.parking_off_street(result.object.tags),
    restriction = SANITIZE_PARKING_TAGS.restriction(result.object.tags.restriction),
    reason = SANITIZE_PARKING_TAGS.reason(result.object.tags.reason),
    staggered = nil,
    traffic_sign = SANITIZE_TAGS.traffic_sign(result.object.tags.traffic_sign),
    zone = SANITIZE_TAGS.safe_string(result.object.tags.zone),

    -- Surface
    surface = surface_tags.value,
    surface_confidence = surface_tags.confidence,
    surface_source = surface_tags.source,

    -- Off street parking attributes:
    category = result.category.id,
    amenity = SANITIZE_TAGS.amenity_off_street_parking(result.object.tags.amenity),
    building = SANITIZE_TAGS.building(result.object.tags.building),
    access = SANITIZE_TAGS.access(result.object.tags.access),
  }

  local result_meta = Metadata(result)

  local cleaned_tags, replaced_tags = sanitize_cleaner.split_cleaned_and_replaced_tags(result_tags, result.object.tags)

  return {
    id = id,
    tags = cleaned_tags,
    meta = result_meta,
    minzoom = 0,
  }, replaced_tags
end

return result_tags_off_street_parking
