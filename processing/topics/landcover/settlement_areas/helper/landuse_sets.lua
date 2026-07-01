local SET = require('topics.helper.sets')

-- Settlement-area input definition ("Siedlungsgebiet") — the tag sets for which OSM polygons
-- count as "human land use". Based on the SupaplexOSM / Alex "Aufwandsschätzer" definition
-- (https://overpass-turbo.eu/s/2q48), with a few civic/rural landuse values added that also sit
-- inside settlements.
-- For what these areas mean and the innerorts/außerorts heuristic caveat, see ../README.md.

local landuse_values = SET.set({
  'residential',
  'commercial',
  'industrial',
  'retail',
  'education',
  'religious',
  'garages',
  'brownfield',
  'construction',
  -- Added beyond the SupaplexOSM base: civic land + farmyards also sit inside settlements.
  'civic',
  'civic_admin',
  'farmyard',
})

local leisure_values = SET.set({
  'park',
  'garden',
  'dog_park',
  'sports_centre',
  'stadium',
})

local amenity_values = SET.set({
  'school',
  'kindergarten',
  'college',
  'university',
  'hospital',
  'clinic',
  'prison',
})

--- Returns which family matched ('landuse'|'leisure'|'amenity'), or nil if the
--- object is not part of the settlement-area definition.
---@param tags OsmTags
---@return 'landuse'|'leisure'|'amenity'|nil
local function settlement_area_category(tags)
  if tags.landuse and landuse_values[tags.landuse] then
    return 'landuse'
  end
  if tags.leisure and leisure_values[tags.leisure] then
    return 'leisure'
  end
  if tags.amenity and amenity_values[tags.amenity] then
    return 'amenity'
  end
  return nil
end

return {
  landuse_values = landuse_values,
  leisure_values = leisure_values,
  amenity_values = amenity_values,
  category = settlement_area_category,
}
