local SET = require('topics.helper.sets')

local trunk_motorway = SET.set({
  'motorway',
  'motorway_link',
  'trunk',
  'trunk_link',
})

---@param tags OsmTags
---@return integer
local function minzoom(tags)
  if tags.aeroway == 'aerodrome' or tags.aerodrome then
    return 8
  end

  if tags.natural == 'water' then
    if tags._is_compact_water then
      return 8
    end
    return 10
  end

  if tags.highway and trunk_motorway[tags.highway] then
    return 5
  end

  if tags.railway == 'rail' or tags.railway == 'light_rail' then
    if tags.usage == 'main' or tags.usage == 'branch' then
      return 5
    end
  end

  if tags.waterway then
    return 10
  end

  return 10
end

return minzoom
