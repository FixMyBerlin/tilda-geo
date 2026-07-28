
-- https://www.lua.org/pil/11.5.html
-- * @desc `set({ 'item' })`
-- * @returns `{ ['item'] = true }`
local function set(array)
  local set_lookup = {}
  -- Reminder: ipairs ensures 'array' is treated as an array (skips object-like keys).
  for _, value in ipairs(array) do
    set_lookup[value] = true
  end
  return set_lookup
end

local function join_sets(sets, dest)
  dest = dest or {}
  for _, set_values in pairs(sets) do
    for key, _ in pairs(set_values) do
      dest[key] = true
    end
  end
  return dest
end

local SET = {
  set = set,
  join_sets = join_sets,
}

return SET
