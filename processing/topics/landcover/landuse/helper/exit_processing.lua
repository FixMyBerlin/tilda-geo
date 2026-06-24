local SET = require('topics.helper.sets')

local allowed_values_landuse = SET.set({
  'allotments',
  'brownfield',
  'cemetery',
  'civic_admin',
  'civic',
  'commercial',
  'construction',
  'farmyard',
  'garages',
  'industrial',
  'religious',
  'residential',
  'retail'
})

local allowed_values_amenity = SET.set({
  'school',
  'university'
})

local function exit_processing(object)
  if not (object.tags.landuse or object.tags.amenity) then
    return true
  end

  if not (allowed_values_landuse[object.tags.landuse] or allowed_values_amenity[object.tags.amenity]) then
    return true
  end

  return false
end

return exit_processing
