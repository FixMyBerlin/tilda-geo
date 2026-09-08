local area_minzoom = require('topics.parking.off_street_parking.helper.area_minzoom')

---@param area number|nil
---@return integer
local function label_minzoom(area)
  return math.max(11, area_minzoom(area))
end

return label_minzoom
