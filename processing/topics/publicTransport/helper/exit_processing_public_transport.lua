require('init')
local SET = require('sets')

local forbidden_usage = SET.set({ 'industrial', 'military', 'leisure', 'science', 'test', 'tourism' })
local allowed_tags = SET.set({ 'tram_stop', 'station', 'halt' })

local function exit_processing_public_transport(object)
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

  if allowed_tags[tags.railway] or tags.amenity == 'ferry_terminal' then
    return false
  end

  return true
end

return exit_processing_public_transport
