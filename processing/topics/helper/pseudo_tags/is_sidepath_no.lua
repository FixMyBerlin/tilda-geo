require('init')
local csv_lookup = require('csv_lookup')

--- Load the is_sidepath_no.csv and lookup `osm_id` to return 'TODO'
--- @param rows table - What is returned from load_csv_is_sidepath_no:get()
--- @param osm_id number|string - The OSM ID to look up.
--- @return 'TODO'|nil - The mapillary coverage type or nil if not found.
local function is_sidepath_no(rows, osm_id)
  local colum_name = 'osm_id'
  ---@diagnostic disable-next-line: return-type-mismatch
  return csv_lookup(rows, osm_id, colum_name)
end

return is_sidepath_no
