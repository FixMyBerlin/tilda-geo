-- Count entries in a table treated as a key/value map (same idea as Penlight `pl.tablex.size` for plain tables).
-- https://lunarmodules.github.io/Penlight/libraries/pl.tablex.html

local function table_size(table)
  local count = 0
  for n in pairs(table) do
    count = count + 1
  end
  return count
end

return table_size
