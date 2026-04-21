require('init')
require('HighwayClasses')

--- Returns _is_sidepath for a way. Only path-like ways (sidepath_highway_classes) get a value.
--- - Path in CSV (estimation = yes) -> 'assumed_yes'
--- - Path not in CSV -> 'assumed_no'
--- - Non-path (e.g. road) -> nil
--- @param rows table - From load_csv_is_sidepath:get(); map osm_id -> row
--- @param osm_id number|string - The OSM way ID to look up.
--- @param highway string|nil - The way's highway tag value (e.g. 'path', 'footway', 'residential').
--- @return 'assumed_yes'|'assumed_no'|nil
local function is_sidepath(rows, osm_id, highway)
  if not highway then
    return nil
  end
  local is_path = sidepath_highway_classes[highway]
  if not is_path then
    return nil
  end
  if rows[tonumber(osm_id)] then
    return 'assumed_yes'
  end
  return 'assumed_no'
end

return is_sidepath
