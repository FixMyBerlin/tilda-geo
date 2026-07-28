describe('bikeroutes minzoom', function()
  local minzoom = require('topics.bikeroutes.helper.minzoom')

  it('returns 5 for national and international routes', function()
    assert.are.same(minzoom({ network = 'ncn' }), 5)
    assert.are.same(minzoom({ network = 'icn' }), 5)
  end)

  it('returns 8 for regional routes', function()
    assert.are.same(minzoom({ network = 'rcn' }), 8)
  end)

  it('returns 9 for local routes', function()
    assert.are.same(minzoom({ network = 'lcn' }), 9)
  end)

  it('returns 5 for cycle highways', function()
    assert.are.same(minzoom({ network = 'lcn', cycle_highway = 'yes' }), 5)
  end)

  it('returns 10 for routes without a known network', function()
    assert.are.same(minzoom({}), 10)
  end)
end)
