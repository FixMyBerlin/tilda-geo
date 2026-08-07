local SET = require('topics.helper.sets')

-- Per-object minzoom for routing segments. The table covers the whole road + path network, so
-- zoomed-out tiles get very large; we surface the most important / longest segments first and push
-- the rest to higher zoom.

local MAJOR_ROADS = SET.set({
  'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link',
})
local MINOR_ROADS = SET.set({
  'residential', 'residential_priority_road', 'unclassified', 'unspecified_road',
  'living_street', 'bicycle_road', 'road',
})

---@param segment { road: string|nil }
---@param length number|nil
---@return integer minzoom
local function routing_infra_generalization(segment, length)
  local road = segment.road
  length = length or 0
  if road and MAJOR_ROADS[road] then
    return 8
  end
  if road and MINOR_ROADS[road] then
    return length >= 250 and 10 or 12
  end
  -- standalone paths / tracks / service, sidepath bikelanes, links, crossings: thin by length.
  return length >= 500 and 12 or 13
end

return routing_infra_generalization
