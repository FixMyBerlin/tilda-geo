require('init')
require('Log')

--- Load the mapillary_coverage.csv and lookup `osm_id` to return nil|'pano'|'regular'
--- @param lines table|nil - Return format of load_csv:get()
--- @param osm_id number|string - The OSM ID to look up.
--- @param column_name string - The row to return
--- @return string|number|nil
local function csv_lookup(lines, osm_id, column_name)
  if not lines then return nil end

  line = lines[tonumber(osm_id)]
  if line then
    return line[column_name]
  else
    return nil
  end
end

return csv_lookup
