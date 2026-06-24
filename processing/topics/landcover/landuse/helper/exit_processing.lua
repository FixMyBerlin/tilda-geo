local SET = require('topics.helper.sets')

local allowed_values_landuse = SET.set({
  'allotments',
  'brownfield',
  'cemetery',
  'civic_admin',
  'civic',
  'commercial',
  'construction',
  'education',
  'farmyard',
  'garages',
  'industrial',
  'religious',
  'residential',
  'retail'
})

local allowed_values_amenity = SET.set({
  'school',
  'university',
  'kindergarten',
  'college',
  'hospital',
  'clinic',
  'prison'
})

local allowed_values_leisure = SET.set({
  'park',
  'garden',
  'dog_park',
  'sports_centre',
  'stadium'
})

local function exit_processing(object)
  if not (object.tags.landuse or object.tags.amenity or object.tags.leisure) then
    return true
  end

  if not (allowed_values_landuse[object.tags.landuse]
      or allowed_values_amenity[object.tags.amenity]
      or allowed_values_leisure[object.tags.leisure]) then
    return true
  end

  return false
end

return exit_processing
