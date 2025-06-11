require('init')
require('class_off_street_parking_category')
require('sanitize_for_logging')
local round = require('round')

local function category_tags(tags)
  return {
    -- NOTE: Sanitization is not ideal; When used as category condition this is implicity sanitized. Otherwise they are raw values.
    amenity = tags.amenity,
    building = tags.building,
    parking = tags.parking,
    access = sanitize_for_logging(tags.access, { 'employees', 'customers', 'permissive', 'private', 'permit' }, { 'yes' }),
  }
end

local category_tags_cc = { 'fee', 'maxstay' }

local function area_tags(area, factor)
  return {
    area = round(area, 2),
    capacity = round(area / factor, 0),
    capacity_confidence = 'medium',
    capacity_source = 'area',
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
    tags = function(tags) return category_tags(tags) end,
    tags_cc = category_tags_cc,
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
      return tags.amenity == 'parking' and tags.parking == 'multi-storey'
    end,
    tags = function(tags) return category_tags(tags) end,
    tags_cc = category_tags_cc,
    capacity_from_area = function(_, area) return area_tags(area, 28.2) end,
  }),
  class_off_street_parking_category.new({
    -- Wiki https://wiki.openstreetmap.org/wiki/DE:Tag:amenity%3Dparking
    id = 'underground',
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'underground'
    end,
    tags = function(tags) return category_tags(tags) end,
    tags_cc = category_tags_cc,
    capacity_from_area = function(_, area) return area_tags(area, 31.3) end,
  }),
  class_off_street_parking_category.new({
    -- Wiki https://wiki.openstreetmap.org/wiki/Tag:building%3Dgarages
    -- Wiki https://wiki.openstreetmap.org/wiki/Tag:building%3Dgarage
    -- Wiki https://wiki.openstreetmap.org/wiki/DE:Tag:amenity%3Dparking
    id = 'garage',
    conditions = function(tags)
      return (
        -- (!) Every single(!) building value(!) needs to be allowed in processing/filter/filter-expressions.txt
        (tags.building == 'garages' or tags.building == 'garage') or
        (tags.amenity == 'parking' and tags.parking == 'garage_boxes')
      )
    end,
    tags = function(tags) return category_tags(tags) end,
    tags_cc = category_tags_cc,
    capacity_from_area = function(_, area) return area_tags(area, 16.8) end,
  }),
  class_off_street_parking_category.new({
    -- Wiki https://wiki.openstreetmap.org/wiki/Tag:building%3Dcarport
    -- Wiki https://wiki.openstreetmap.org/wiki/DE:Tag:amenity%3Dparking
    id = 'carport',
    conditions = function(tags)
      return (
        -- (!) Every single(!) building value(!) needs to be allowed in processing/filter/filter-expressions.txt
        (tags.building == 'carport') or
        (tags.amenity == 'parking' and tags.parking == 'carport') or
        (tags.amenity == 'parking' and tags.parking == 'sheds')
      )
    end,
    tags = function(tags) return category_tags(tags) end,
    tags_cc = category_tags_cc,
    capacity_from_area = function(_, area) return area_tags(area, 14.9) end,
  }),
}

return off_street_parking_area_categories
