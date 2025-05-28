describe('load_csv', function()
  require('init')
  require('Log')
  require('TableSize')
  local load_csv = require('load_csv')
  local pl = require('pl.tablex')

  local test_csv = '/processing/topics/helper/pseudo_tags/__tests__/test_mapillary_coverage.csv'
  local data = load_csv(test_csv)
  local lines = data:get()

  it('returns the csv as table', function()
    assert.are.equal(pl.size(lines), 3)

    assert.are.equal(type(lines[123]), 'table')
    assert.are.equal(lines[123]['mapillary_coverage'], 'pano')

    assert.are.equal(type(lines[456]), 'table')
    assert.are.equal(lines[456]['mapillary_coverage'], 'regular')

    assert.are.equal(type(lines[789]), 'table')
    assert.are.equal(lines[789]['mapillary_coverage'], 'pano')
  end)
end)
