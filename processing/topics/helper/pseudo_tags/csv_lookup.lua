require('init')
require('Log')

--- Load the mapillary_coverage.csv and lookup `osm_id` to return nil|'pano'|'regular'
--- @param osm_id number|string - The OSM ID to look up.
--- @param column_name string - The row to return
--- @return string|number|nil
local function csv_lookup(rows, osm_id, column_name)
  for _, row in ipairs(rows) do
    if tonumber(row['osm_id']) == tonumber(osm_id) then
      return row[column_name]
    end
  end
  return nil
end

return csv_lookup
