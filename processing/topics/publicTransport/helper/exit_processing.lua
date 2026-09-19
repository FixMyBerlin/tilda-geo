local SET = require('topics.helper.sets')

local forbidden_usage = SET.set({ 'industrial', 'military', 'leisure', 'science', 'test', 'tourism' })
local allowed_tags = SET.set({ 'tram_stop', 'station', 'halt' })

local function exit_processing(object)
  local tags = object.tags

  if forbidden_usage[tags.usage] then
    return true
  end
  if tags.operator == 'Berliner Parkeisenbahn' then
    return true
  end
  if tags.disused == 'yes' then
    return true
  end

  -- `highway=bus_stop` is the dominant bus stop tagging in DE; we take every node with it
  -- (platform node as well as the legacy `public_transport=stop_position` variant).
  if allowed_tags[tags.railway] or tags.amenity == 'ferry_terminal' or tags.highway == 'bus_stop' then
    return false
  end

  return true
end

return exit_processing
