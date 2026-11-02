---@alias BicycleParkingKind 'bicycle_parking'|'cargo_bike_parking'|'small_electric_vehicle_parking'|'mobility_hub'|'bicycle_rental'

--- The `amenity` values of this topic and the `kind` of their rows.
--- `bicycle_parking` can also give `cargo_bike_parking` rows (see kind_parts.lua).
---@type table<string, BicycleParkingKind>
local AMENITY_KINDS = {
  bicycle_parking = 'bicycle_parking',
  small_electric_vehicle_parking = 'small_electric_vehicle_parking',
  ['kick-scooter_parking'] = 'small_electric_vehicle_parking',
  mobility_hub = 'mobility_hub',
  bicycle_rental = 'bicycle_rental',
}

return AMENITY_KINDS
