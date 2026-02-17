require('init')
local csv_lookup = require('csv_lookup')

--- Lookup is_sidepath_estimation from sidepath CSV and return assumed_yes|assumed_no|nil
--- @param rows table - What is returned from load_csv_is_sidepath:get()
--- @param osm_id number|string - The OSM way ID to look up.
--- @return 'assumed_yes'|'assumed_no'|nil
local function is_sidepath(rows, osm_id)
  local column_name = 'is_sidepath_estimation'
  local raw = csv_lookup(rows, osm_id, column_name)
  if raw == 'true' then
    return 'assumed_yes'
  end
  if raw == 'false' then
    return 'assumed_no'
  end
  return nil
end

return is_sidepath
