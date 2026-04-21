require('init')
local load_csv_mapillary = require('load_csv_mapillary')

local CSV_FILE = '/data/pseudoTagsData/mapillary_coverage.csv'

local function load_csv_mapillary_coverage()
  return load_csv_mapillary(CSV_FILE)
end

return load_csv_mapillary_coverage
