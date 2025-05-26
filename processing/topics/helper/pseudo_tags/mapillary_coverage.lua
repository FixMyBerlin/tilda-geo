require('init')
local csv_lookup = require('csv_lookup')

--- Load the mapillary_coverage.csv and lookup `osm_id` to return nil|'pano'|'regular'
--- @param rows table - What is returned from load_csv_mapillary_coverage:get()
--- @param osm_id number|string - The OSM ID to look up.
--- @return 'pano'|'regular'|nil - The mapillary coverage type or nil if not found.
local function mapillary_coverage(rows, osm_id)
  local colum_name = 'mapillary_coverage'
  ---@diagnostic disable-next-line: return-type-mismatch
  return csv_lookup(rows, osm_id, colum_name)
end

return mapillary_coverage
