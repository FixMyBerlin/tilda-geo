describe('publicTransport minzoom', function()
  local minzoom = require('topics.publicTransport.helper.minzoom')

  it('returns 8 for railway stations', function()
    assert.are.same(minzoom({ category = 'railway_station' }), 8)
  end)

  it('returns 10 for light rail stations', function()
    assert.are.same(minzoom({ category = 'light_rail_station' }), 10)
  end)

  it('returns 13 for ferry, subway and tram stations', function()
    assert.are.same(minzoom({ category = 'ferry_station' }), 13)
    assert.are.same(minzoom({ category = 'subway_station' }), 13)
    assert.are.same(minzoom({ category = 'tram_station' }), 13)
  end)

  it('returns 14 for bus stops', function()
    assert.are.same(minzoom({ category = 'bus_stop' }), 14)
  end)

  it('returns 13 for unknown categories', function()
    assert.are.same(minzoom({ category = 'undefined' }), 13)
  end)
end)
