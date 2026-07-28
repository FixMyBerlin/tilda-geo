local category_minzoom = {
  railway_station = 8,
  light_rail_station = 10,
  tram_station = 13,
  ferry_station = 13,
  subway_station = 13,
}

---@param result_tags table
---@return integer
local function minzoom(result_tags)
  return category_minzoom[result_tags.category] or 13
end

return minzoom
