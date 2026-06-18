describe('landuse minzoom', function()
  local minzoom = require('topics.landuse.helper.minzoom')

  it('returns 10 for all landuse rows', function()
    assert.are.same(minzoom({ landuse = 'residential' }), 10)
    assert.are.same(minzoom({ landuse = 'industrial' }), 10)
  end)
end)
