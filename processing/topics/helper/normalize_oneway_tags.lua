local SET = require('topics.helper.sets')
local is_roundabout = require('topics.helper.is_roundabout')

-- `1` and `true` mean `yes`: https://wiki.openstreetmap.org/wiki/Key:oneway
local YES_ALIASES = SET.set({ '1', 'true' })

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
  -- Roundabouts without `oneway` become `oneway=yes`; `oneway=no` overrides it. The two values differ in the wiki:
  -- * `junction=roundabout` implies `oneway=yes`, so the tag is a real default that is almost never mapped:
  --   https://wiki.openstreetmap.org/wiki/Tag:junction=roundabout
  -- * `junction=circular` requires `oneway` to be tagged, because some of them have two-way traffic:
  --   https://wiki.openstreetmap.org/wiki/Tag:junction=circular
  --   So `yes` may be wrong there. We accept that guess: we expect `oneway` to be mapped on these,
  --   and `oneway=no` where the circular junction is not one-way.
  if tags.oneway == nil and is_roundabout(tags) then
    tags.oneway = 'yes'
  end
end

return normalize_oneway_tags
