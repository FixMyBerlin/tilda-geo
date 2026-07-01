local SET = require('topics.helper.sets')

-- Single source of truth for the `landuse` display table's allowed values, split by the OSM tag
-- family they come from. amenity/leisure areas are normalised onto the `landuse` output key, so
-- matched_value() returns the one value that passed the allowlist (priority landuse > amenity >
-- leisure). Both the filter (exit_processing.lua) and result_tags.lua use it, so they never
-- disagree. Mirrors the settlement side's settlement_areas/helper/landuse_sets.lua `category()`.

local landuse_values = SET.set({
  'allotments',
  'brownfield',
  'cemetery',
  'civic',
  'civic_admin',
  'commercial',
  'construction',
  'education',
  'farmyard',
  'garages',
  'industrial',
  'religious',
  'residential',
  'retail',
})

local amenity_values = SET.set({
  'school',
  'university',
  'kindergarten',
  'college',
  'hospital',
  'clinic',
  'prison',
})

local leisure_values = SET.set({
  'park',
  'garden',
  'dog_park',
  'sports_centre',
  'stadium',
})

--- The single value to store in the `landuse` column for an object, or nil if it is not an allowed
--- land-use area. Returns the value that matched the allowlist — NOT the first tag present — so a
--- polygon admitted via e.g. leisure=park that also carries a non-allowed landuse=grass stores
--- `park`, never `grass`.
---@param tags table
---@return string|nil
local function matched_value(tags)
  if tags.landuse and landuse_values[tags.landuse] then
    return tags.landuse
  end
  if tags.amenity and amenity_values[tags.amenity] then
    return tags.amenity
  end
  if tags.leisure and leisure_values[tags.leisure] then
    return tags.leisure
  end
  return nil
end

return {
  landuse_values = landuse_values,
  amenity_values = amenity_values,
  leisure_values = leisure_values,
  matched_value = matched_value,
}
