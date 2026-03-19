require('init')
local load_csv_mapillary_coverage = require('load_csv_mapillary_coverage')
local mapillary_coverage = require('mapillary_coverage')
local load_csv_is_sidepath = require('load_csv_is_sidepath')
local is_sidepath = require('is_sidepath')

local mapillary_coverage_data = load_csv_mapillary_coverage()
local is_sidepath_data = load_csv_is_sidepath()

local function prepare_pseudo_tags_roads_bikelanes(object_tags, object_id)
  local mapillary_coverage_lines = mapillary_coverage_data:get()
  object_tags.mapillary_coverage = mapillary_coverage(mapillary_coverage_lines, object_id)

  local is_sidepath_lines = is_sidepath_data:get()
  object_tags._is_sidepath = is_sidepath(is_sidepath_lines, object_id, object_tags.highway)
end

return prepare_pseudo_tags_roads_bikelanes
