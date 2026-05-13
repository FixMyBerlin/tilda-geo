require('init')
local load_csv_sidepath = require('load_csv_sidepath')

local CSV_FILE = '/data/pseudoTagsData/is_sidepath_estimation.csv'

local function load_csv_is_sidepath()
  return load_csv_sidepath(CSV_FILE)
end

return load_csv_is_sidepath
