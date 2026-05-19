
---@param direction string
---@return number|nil
local function cardinal_direction_to_degree(direction)
  local direction_map = {
    ['north'] = 0,
    ['east'] = 90,
    ['south'] = 180,
    ['west'] = 270,
    ['N'] = 0,
    ['NNE'] = 22,
    ['NE'] = 45,
    ['ENE'] = 67,
    ['E'] = 90,
    ['ESE'] = 112,
    ['SE'] = 135,
    ['SSE'] = 157,
    ['S'] = 180,
    ['SSW'] = 202,
    ['SW'] = 225,
    ['WSW'] = 247,
    ['W'] = 270,
    ['WNW'] = 292,
    ['NW'] = 315,
    ['NNW'] = 337,
  }
  return direction_map[direction]
end

return cardinal_direction_to_degree
