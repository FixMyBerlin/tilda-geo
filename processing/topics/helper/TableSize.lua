-- https://stackoverflow.com/a/64882015/729221

-- TODO: Replace with…
-- https://lunarmodules.github.io/Penlight/libraries/pl.tablex.html
-- local pl = require('pl.tablex')
-- pl.size(lines) == 3

function TableSize(table)
  local count = 0
  for n in pairs(table) do
    count = count + 1
  end
  return count
end
