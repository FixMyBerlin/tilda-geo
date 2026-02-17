require('init')

--- Load the mapillary_coverage.csv and lookup `osm_id` to return nil|'pano'|'regular'
--- @param rows table - What is returned from load_csv_mapillary_coverage:get()
--- @param osm_id number|string - The OSM ID to look up.
--- @return 'pano'|'regular'|nil - The mapillary coverage type or nil if not found.
local function mapillary_coverage(rows, osm_id)
  if not rows then return nil end
  local row = rows[tonumber(osm_id)]
  if row then
    return row['mapillary_coverage']
  end
  return nil
end

return mapillary_coverage
