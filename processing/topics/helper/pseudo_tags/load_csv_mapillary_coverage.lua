require('init')
local load_csv = require('load_csv')

local CSV_FILE = '/data/pseudoTagsData/mapillaryCoverageData/mapillary_coverage.csv'

local function load_csv_mapillary_coverage()
  return load_csv(CSV_FILE)
end

return load_csv_mapillary_coverage
