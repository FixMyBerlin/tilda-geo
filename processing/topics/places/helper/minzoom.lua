local SET = require('topics.helper.sets')

local minzoom6_places = SET.set({
  'city',
  'town',
})

local minzoom10_places = SET.set({
  'village',
})

---@param result_tags table
---@return integer
local function minzoom(result_tags)
  if minzoom6_places[result_tags.place] then
    return 6
  end
  if minzoom10_places[result_tags.place] then
    return 10
  end
  return 11
end

return minzoom
