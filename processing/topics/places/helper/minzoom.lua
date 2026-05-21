local SET = require('topics.helper.sets')

local minzoom9_places = SET.set({
  'city',
  'town',
})

local minzoom10_places = SET.set({
  'village',
})

---@param result_tags table
---@return integer
local function minzoom(result_tags)
  if minzoom9_places[result_tags.place] then
    return 9
  end
  if minzoom10_places[result_tags.place] then
    return 10
  end
  return 11
end

return minzoom
