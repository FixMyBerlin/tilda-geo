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
      -- For surface like parking we have two values, one for large areas, one for smaller…
      local sqm_small = 14.5
      local is_small = area < (8  * sqm_small)
      if is_small then return area_tags(area, sqm_small) end
      return area_tags(area, 21.7)
    end,
  }),
  class_off_street_parking_category.new({
    -- Wiki https://wiki.openstreetmap.org/wiki/DE:Tag:amenity%3Dparking
    id = 'building',
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
