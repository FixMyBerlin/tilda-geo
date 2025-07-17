require('init')
local load_csv = require('load_csv')

local CSV_FILE = '/data/pseudoTagsData/isSidepathNoData/is_sidepath_no.csv'

local function load_csv_is_sidepath_no()
  return load_csv(CSV_FILE)
end

return load_csv_is_sidepath_no
