describe('entrance_category', function()
  require('topics.helper.osm2pgsql')
  local entrance_category = require('topics.entrances.helper.entrance_category')

  it('puts subway entrances into public_transport, also when they have `entrance=yes`', function()
    assert.are.equal(entrance_category({ railway = 'subway_entrance', entrance = 'yes' }), 'public_transport')
  end)

  it('skips disused subway entrances', function()
    assert.is_nil(entrance_category({ railway = 'subway_entrance', disused = 'yes' }))
  end)

  -- https://www.openstreetmap.org/node/7618615424
  it('skips parking entrances, also when they have `entrance=yes`', function()
    assert.is_nil(entrance_category({
      amenity = 'parking_entrance',
      parking = 'underground',
      entrance = 'yes',
    }))
  end)

  it('puts every other `entrance=*` into building', function()
    assert.are.equal(entrance_category({ entrance = 'main' }), 'building')
    assert.are.equal(entrance_category({ entrance = 'garage' }), 'building')
  end)

  it('skips nodes without an entrance', function()
    assert.is_nil(entrance_category({ amenity = 'parking_entrance' }))
  end)
end)
