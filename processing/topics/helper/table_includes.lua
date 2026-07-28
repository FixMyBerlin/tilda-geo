-- Helper function to check if a value is in a table
-- Expect `tbl` to be of this shape: `{ advisory_or_exclusive = 'prio1', missing_surface = 'prio1' }`
local function table_includes(tbl, value)
  if type(tbl) ~= 'table' then
    print('Error: tbl is not a table')
    return false
  end

  for key, _ in pairs(tbl) do
    if key == value then
      return true
    end
  end
  return false
end

return table_includes
