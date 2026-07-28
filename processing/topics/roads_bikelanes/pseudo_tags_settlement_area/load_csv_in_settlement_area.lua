-- Reuses the generic (despite the name) CSV loader from pseudo_tags_sidepath.
local load_csv_sidepath = require('topics.roads_bikelanes.pseudo_tags_sidepath.load_csv_sidepath')

local CSV_FILE = '/data/pseudoTagsData/settlement_area_estimation.csv'

local function load_csv_in_settlement_area()
  return load_csv_sidepath(CSV_FILE)
end

return load_csv_in_settlement_area
