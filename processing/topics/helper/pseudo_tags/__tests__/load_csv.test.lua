require('init')
require('Log')
local load_csv = require('load_csv')

describe('load_csv', function()
  local test_csv = '/processing/topics/helper/pseudo_tags/__tests__/test_mapillary_coverage.csv'
  local get_rows = load_csv(test_csv)
  local rows = get_rows()

  it('returns the csv as table', function()
    assert.are.equal(#rows, 3)

    assert.are.equal(rows[1].osm_id, '123')
    assert.are.equal(rows[1].mapillary_coverage, 'pano')

    assert.are.equal(rows[2].osm_id, '456')
    assert.are.equal(rows[2].mapillary_coverage, 'regular')

    assert.are.equal(rows[3].osm_id, '789')
    assert.are.equal(rows[3].mapillary_coverage, 'pano')
  end)
end)
