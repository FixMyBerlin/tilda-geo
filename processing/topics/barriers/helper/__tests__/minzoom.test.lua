describe('barriers minzoom', function()
  local minzoom = require('topics.barriers.helper.minzoom')

  it('returns 5 for motorways and trunk roads', function()
    assert.are.same(minzoom({ highway = 'motorway' }), 5)
    assert.are.same(minzoom({ highway = 'trunk_link' }), 5)
  end)

  it('returns 5 for mainline railways', function()
    assert.are.same(minzoom({ railway = 'rail', usage = 'main' }), 5)
    assert.are.same(minzoom({ railway = 'light_rail', usage = 'branch' }), 5)
  end)

  it('returns 8 for aerodromes and compact large water', function()
    assert.are.same(minzoom({ aeroway = 'aerodrome' }), 8)
    assert.are.same(minzoom({ natural = 'water', _is_compact_water = true }), 8)
  end)

  it('returns 10 for elongated water and other line barriers', function()
    assert.are.same(minzoom({ natural = 'water', _is_compact_water = false }), 10)
    assert.are.same(minzoom({ waterway = 'river' }), 10)
  end)
end)
