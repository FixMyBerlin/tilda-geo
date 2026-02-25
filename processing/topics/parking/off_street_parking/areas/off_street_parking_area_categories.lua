require('init')
require('class_off_street_parking_category')
local round = require('round')

local function area_tags(area, factor)
  return {
    value = round(area / factor, 0),
    confidence = 'medium',
    source = 'area',
  }
end

local off_street_parking_area_categories = {
  class_off_street_parking_category.new({
    -- Wiki https://wiki.openstreetmap.org/wiki/DE:Tag:amenity%3Dparking
    id = 'outside',
    conditions = function(tags)
      return tags.amenity == 'parking' and (
        tags.parking == nil or
        tags.parking == 'surface' or
        tags.parking == 'rooftop' or
        tags.parking == 'layby'
      )
    end,
    capacity_from_area = function(_, area)
      -- Surface parking: three zones by fixed area (no capacity-based thresholds, so no jumps at boundaries).
      -- Regression is driven by capacities at the boundaries (not m²/space factors).
      local AREA_SMALL_MAX = 120
      local AREA_LARGE_MIN = 1500
      local CAPACITY_AT_SMALL = 8   -- capacity at 120 m²
      local CAPACITY_AT_LARGE = 50  -- capacity at 1500 m²
      local FACTOR_SMALL_ZONE = 14.8  -- m² per space for area < 120

      if area < AREA_SMALL_MAX then return area_tags(area, FACTOR_SMALL_ZONE) end
      if area > AREA_LARGE_MIN then return area_tags(area, AREA_LARGE_MIN / CAPACITY_AT_LARGE) end

      -- Medium: factor (m²/space) interpolated from boundary capacities so capacity is continuous.
      local factor = (AREA_SMALL_MAX / CAPACITY_AT_SMALL)
        + ((AREA_LARGE_MIN / CAPACITY_AT_LARGE) - (AREA_SMALL_MAX / CAPACITY_AT_SMALL))
        * (area - AREA_SMALL_MAX) / (AREA_LARGE_MIN - AREA_SMALL_MAX)
      return area_tags(area, factor)
    end,
  }),
  class_off_street_parking_category.new({
    -- Wiki https://wiki.openstreetmap.org/wiki/DE:Tag:amenity%3Dparking
    -- Wiki https://wiki.openstreetmap.org/wiki/DE:Tag:parking%3Dmulti-storey
    id = 'multi-storey',
    conditions = function(tags)
      if tags.amenity == 'parking' and tags.parking == 'multi-storey' then
        return true
      end
      -- CRITICAL: Keep in sync with sanitize_parking_tags.lua (parking_off_street) and filter-expressions.txt
      return tags.building == 'parking'
    end,
    capacity_from_area = function(_, area) return area_tags(area, 28.2) end,
  }),
  class_off_street_parking_category.new({
    -- Wiki https://wiki.openstreetmap.org/wiki/DE:Tag:amenity%3Dparking
    id = 'underground',
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'underground'
    end,
    capacity_from_area = function(_, area) return area_tags(area, 31.3) end,
  }),
  class_off_street_parking_category.new({
    -- Wiki https://wiki.openstreetmap.org/wiki/Tag:building%3Dgarages
    -- Wiki https://wiki.openstreetmap.org/wiki/Tag:building%3Dgarage
    -- Wiki https://wiki.openstreetmap.org/wiki/DE:Tag:amenity%3Dparking
    id = 'garage',
    conditions = function(tags)
      return (
        -- CRITICAL: Keep in sync with sanitize_parking_tags.lua (parking_off_street) and filter-expressions.txt
        (tags.building == 'garages' or tags.building == 'garage') or
        (tags.amenity == 'parking' and tags.parking == 'garage_boxes')
      )
    end,
    capacity_from_area = function(_, area) return area_tags(area, 16.8) end,
  }),
  class_off_street_parking_category.new({
    -- Wiki https://wiki.openstreetmap.org/wiki/Tag:building%3Dcarport
    -- Wiki https://wiki.openstreetmap.org/wiki/DE:Tag:amenity%3Dparking
    id = 'carport',
    conditions = function(tags)
      return (
        -- CRITICAL: Keep in sync with sanitize_parking_tags.lua (parking_off_street) and filter-expressions.txt
        (tags.building == 'carport') or
        (tags.amenity == 'parking' and tags.parking == 'carport') or
        (tags.amenity == 'parking' and tags.parking == 'sheds')
      )
    end,
    capacity_from_area = function(_, area) return area_tags(area, 14.9) end,
  }),
}

return off_street_parking_area_categories
