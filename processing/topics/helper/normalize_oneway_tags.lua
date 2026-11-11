local SET = require('topics.helper.sets')

-- `1` and `true` mean `yes`: https://wiki.openstreetmap.org/wiki/Key:oneway
local YES_ALIASES = SET.set({ '1', 'true' })
-- A roundabout implies `oneway=yes`: https://wiki.openstreetmap.org/wiki/Tag:junction=roundabout
local ONEWAY_JUNCTIONS = SET.set({ 'roundabout', 'circular' })

local ONEWAY_KEYS = { 'oneway', 'oneway:bicycle' }
for _, prefix in ipairs({ 'cycleway', 'sidewalk' }) do
  for _, infix in ipairs({ '', ':left', ':right', ':both' }) do
    table.insert(ONEWAY_KEYS, prefix .. infix .. ':oneway')
  end
end
-- `construction:*` tags become the main tags later (`transform_construction_prefix`).
for index = 1, #ONEWAY_KEYS do
  table.insert(ONEWAY_KEYS, 'construction:' .. ONEWAY_KEYS[index])
end

-- Mutate the one-way tags in place so that later steps only compare with `yes`, `-1` and `no`.
---@param tags OsmTags
local function normalize_oneway_tags(tags)
  for _, key in ipairs(ONEWAY_KEYS) do
    if YES_ALIASES[tags[key]] then
      tags[key] = 'yes'
    end
  end
  if tags.oneway == nil and ONEWAY_JUNCTIONS[tags.junction] then
    tags.oneway = 'yes'
  end
end

return normalize_oneway_tags
