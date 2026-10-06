-- Vehicle access keys used by the parking condition classifier and its tag sanitizer
return {
  'motorcar', -- we understand this synonym to 'passenger_car', see https://wiki.openstreetmap.org/wiki/Key:motorcar#Controversy
  'passenger_car', -- proposed explicit tagging for 'passenger cars only'
  'disabled',
  'car_sharing',
  'motorcycle',
  'goods',
  'hgv',
  'bus',
  'tourist_bus',
  'coach',
  'psv',
  'taxi',
  'motorhome',
  'emergency',
  -- some access values that we can treat like vehicle types
  'delivery',
  'agricultural',
  'forestry',
}
