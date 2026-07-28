local SET = require('topics.helper.sets')

-- Hide those ways with road=*
local minzoom11_road_classes = SET.set({
  'residential',
  'living_street',
  'bicycle_road',
  'pedestrian',
  'unclassified',
  'residential_priority_road',
  'unspecified_road',
  'service_road',
  'service_alley',
})

---@param original_tags table
---@param result_tags table
---@return integer
--- Return the minzoom for roads
local function road_generalization(original_tags, result_tags)
  if minzoom11_road_classes[result_tags.road] then
    return 11
  end
  return 0
end

return road_generalization
