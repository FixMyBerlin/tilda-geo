-- Off-street polygons follow street-parking detail (z14) unless they are large
-- enough to read at overview, same idea as `parkings_edges` length minzoom.
-- Thresholds are OSM polygon area in m².

---@param area number|nil
---@return integer
local function area_minzoom(area)
  if not area then
    return 14
  end
  if area >= 10000 then
    return 10
  end
  if area >= 2500 then
    return 11
  end
  if area >= 600 then
    return 12
  end
  if area >= 200 then
    return 13
  end
  return 14
end

return area_minzoom
