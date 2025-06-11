require('init')
require('Log')

--- Check the format of the CSV
--- @param column_name string - The row to return
--- @return string|number|nil
local function test_csv_format(rows, column_name)
  if type(rows) ~= "table" then
    error('CSV has no content (input type ' .. type(rows) .. ')')
  end
  if #rows < 1 then
    error('CSV has no content (row count ' .. #rows .. ')')
  end

  local first = rows[1]
  if first['osm_id'] == nil then
    error('CSV missing required column_name `osm_id`')
  end
  if first[column_name] == nil then
    error('CSV missing required column_name `'..column_name..'``')
  end
end

return test_csv_format
