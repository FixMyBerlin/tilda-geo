local has_prefix = require('topics.helper.has_prefix')

-- Keys whose lifecycle belongs to a side of the centerline, not to the road:
-- `cycleway:right:lifecycle` becomes the `lifecycle` of the right bikelane (see `bikelanes/transformations.lua`).
local PREFIXES = { 'cycleway', 'sidewalk' }
local SIDE_INFIXES = { '', ':left', ':right', ':both' }

---@type string[] `cycleway`, `cycleway:left`, … `sidewalk:both`
local side_keys = {}
for _, prefix in ipairs(PREFIXES) do
  for _, infix in ipairs(SIDE_INFIXES) do
    table.insert(side_keys, prefix .. infix)
  end
end

---@param key string
---@return boolean `true` for `cycleway`, `cycleway:*`, `sidewalk`, `sidewalk:*`
local function is_side_key(key)
  for _, prefix in ipairs(PREFIXES) do
    if key == prefix or has_prefix(key, prefix .. ':') then return true end
  end
  return false
end

return {
  side_keys = side_keys,
  is_side_key = is_side_key,
}
