require('init')
require('Log')
local load_csv = require('load_csv')
local csv_lookup = require('csv_lookup')

describe('csv_lookup', function()
  local test_csv = '/processing/topics/helper/pseudo_tags/__tests__/test_mapillary_coverage.csv'
  local get_rows = load_csv(test_csv)
  local rows = get_rows()
  local colum_name = 'mapillary_coverage'

  it('works when id known', function()
    local osm_id = "123"
    ---@diagnostic disable-next-line: return-type-mismatch
    local lookup = csv_lookup(rows, osm_id, colum_name)
    assert.are.equal(lookup, 'pano')
  end)

  it('fails when id unkown', function()
    local osm_id = "999"
    ---@diagnostic disable-next-line: return-type-mismatch
    local lookup = csv_lookup(rows, osm_id, colum_name)
    assert.are.equal(lookup, nil)
  end)
end)
