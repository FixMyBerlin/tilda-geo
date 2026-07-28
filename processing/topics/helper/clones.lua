
local function structured_clone(original)
  if type(original) ~= 'table' then
    return original -- Return non-table values as is
  end

  local copy = {}
  for key, value in pairs(original) do
    if type(value) == 'table' then
      copy[key] = structured_clone(value) -- Recursively clone nested tables
    else
      copy[key] = value
    end
  end
  return copy
end

-- Thanks to https://gist.github.com/tylerneylon/81333721109155b2d244#file-copy-lua-L77-L88
local function meta_clone(obj, seen)
  -- Handle non-tables and previously-seen tables.
  if type(obj) ~= 'table' then return obj end
  if seen and seen[obj] then return seen[obj] end

  -- New table; mark it as seen and copy recursively.
  local s = seen or {}
  local res = {}
  s[obj] = res
  for k, v in pairs(obj) do res[meta_clone(k, s)] = meta_clone(v, s) end
  return setmetatable(res, getmetatable(obj))
end

local CLONE = {
  structured_clone = structured_clone,
  meta_clone = meta_clone,
}

return CLONE
