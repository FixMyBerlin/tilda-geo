describe('bikeroutes minzoom', function()
  local minzoom = require('topics.bikeroutes.helper.minzoom')

  it('returns 8 for national and international routes', function()
    assert.are.same(minzoom({ network = 'ncn' }), 8)
    assert.are.same(minzoom({ network = 'icn' }), 8)
  end)

  it('returns 8 for regional and local routes', function()
    assert.are.same(minzoom({ network = 'rcn' }), 8)
    assert.are.same(minzoom({ network = 'lcn' }), 8)
  end)

  it('returns 9 for cycle highways', function()
    assert.are.same(minzoom({ network = 'lcn', cycle_highway = 'yes' }), 9)
  end)

  it('returns 10 for routes without a known network', function()
    assert.are.same(minzoom({}), 10)
  end)
end)
