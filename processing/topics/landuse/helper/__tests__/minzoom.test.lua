describe('landuse minzoom', function()
  local minzoom = require('topics.landuse.helper.minzoom')

  it('returns 11 for all landuse rows', function()
    assert.are.same(minzoom({ landuse = 'residential' }), 11)
    assert.are.same(minzoom({ landuse = 'industrial' }), 11)
  end)
end)
