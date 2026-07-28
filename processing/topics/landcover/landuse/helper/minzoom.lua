local MIN_AREA_INCLUDE = 5000
local MIN_AREA_Z10 = 50000
local MIN_AREA_Z9 = 500000

---@param area number|nil
---@return boolean
local function is_excluded(area)
  return not area or area < MIN_AREA_INCLUDE
end

---@param tags OsmTags
---@return integer
local function minzoom(tags)
  local area = tags._computed_area
  if area >= MIN_AREA_Z9 then
    return 9
  end
  if area >= MIN_AREA_Z10 then
    return 10
  end
  return 12
end

return {
  MIN_AREA_INCLUDE = MIN_AREA_INCLUDE,
  MIN_AREA_Z10 = MIN_AREA_Z10,
  MIN_AREA_Z9 = MIN_AREA_Z9,
  is_excluded = is_excluded,
  minzoom = minzoom,
}
