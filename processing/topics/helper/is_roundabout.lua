local SET = require('topics.helper.sets')

-- https://wiki.openstreetmap.org/wiki/Tag:junction=roundabout
-- https://wiki.openstreetmap.org/wiki/Tag:junction=circular
local ROUNDABOUT_JUNCTIONS = SET.set({ 'roundabout', 'circular' })

-- The way is part of a roundabout (`junction=roundabout|circular`).
---@param tags OsmTags
---@return boolean
local function is_roundabout(tags)
  return ROUNDABOUT_JUNCTIONS[tags.junction] == true
end

return is_roundabout
