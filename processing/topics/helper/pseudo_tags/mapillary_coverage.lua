require('init')
local load_csv = require('load_csv')
local csv_lookup = require('csv_lookup')
local test_csv_format = require('test_csv_format')

local CSV_FILE = '/data/pseudoTagsData/mapillaryCoverageData/mapillary_coverage.csv'

--- Load the mapillary_coverage.csv and lookup `osm_id` to return nil|'pano'|'regular'
--- @param osm_id number|string - The OSM ID to look up.
--- @return 'pano'|'regular'|nil - The mapillary coverage type or nil if not found.
local function mapillary_coverage(osm_id)
  local get_rows = load_csv(CSV_FILE)
  local rows = get_rows()
  local colum_name = 'mapillary_coverage'
  test_csv_format(rows, colum_name)

  ---@diagnostic disable-next-line: return-type-mismatch
  return csv_lookup(rows, osm_id, colum_name)
end

return mapillary_coverage
