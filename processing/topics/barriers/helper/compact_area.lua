local MIN_AREA_Z10 = 10000
local MIN_AREA_Z8 = 100000
local MIN_COMPACTNESS_RATIO = 3

---@param area number|nil
---@param perimeter number|nil
---@return boolean
local function is_compact_water(area, perimeter)
  if not area or area < MIN_AREA_Z8 then
    return false
  end
  if not perimeter or perimeter <= 0 then
    return true
  end
  return (area / perimeter) >= MIN_COMPACTNESS_RATIO
end

return {
  MIN_AREA_Z10 = MIN_AREA_Z10,
  is_compact_water = is_compact_water,
}
