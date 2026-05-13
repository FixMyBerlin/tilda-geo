require('init')
local load_csv_mapillary = require('load_csv_mapillary')
local mapillary_coverage = require('mapillary_coverage')

describe('mapillary_coverage', function()
  local test_csv = '/processing/topics/roads_bikelanes/pseudo_tags_mapillary_coverage/__tests__/test_mapillary_coverage.csv'
  local data = load_csv_mapillary(test_csv)
  local rows = data:get()

  it('works when id known', function()
    local osm_id = '123'
    local coverage = mapillary_coverage(rows, osm_id)
    assert.are.equal(coverage, 'pano')
  end)

  it('fails when id unkown', function()
    local osm_id = '999'
    local coverage = mapillary_coverage(rows, osm_id)
    assert.are.equal(coverage, nil)
  end)
end)
