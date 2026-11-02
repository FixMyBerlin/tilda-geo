-- The category is picked by a cascade in result_tags.lua: a later rule overrides an earlier one.
-- These cases pin down the priority for tag combinations that occur in OSM.
describe('publicTransport result_tags category', function()
  local osm2pgsql = require('topics.helper.osm2pgsql')
  local result_tags = require('topics.publicTransport.helper.result_tags')

  local function category(tags)
    return result_tags(tags).category
  end

  it('maps single tags to their category', function()
    assert.are.equal(category({ highway = 'bus_stop' }), 'bus_stop')
    assert.are.equal(category({ railway = 'station' }), 'railway_station')
    assert.are.equal(category({ railway = 'halt' }), 'railway_station')
    assert.are.equal(category({ amenity = 'ferry_terminal' }), 'ferry_station')
    assert.are.equal(category({ railway = 'tram_stop' }), 'tram_station')
  end)

  it('uses the station subtag of railway stations', function()
    assert.are.equal(category({ railway = 'station', station = 'subway' }), 'subway_station')
    assert.are.equal(category({ railway = 'station', station = 'light_rail' }), 'light_rail_station')
  end)

  it('prefers the rail category on combined bus and rail stops', function()
    assert.are.equal(category({ railway = 'tram_stop', highway = 'bus_stop' }), 'tram_station')
    assert.are.equal(category({ railway = 'halt', highway = 'bus_stop' }), 'railway_station')
  end)

  -- `station=*` belongs to railway=station/halt; on a tram stop the main tag wins.
  it('keeps tram stops as tram stations even with station=subway', function()
    assert.are.equal(category({ railway = 'tram_stop', station = 'subway' }), 'tram_station')
  end)

  it('prefers ferry over railway station', function()
    assert.are.equal(category({ amenity = 'ferry_terminal', railway = 'station' }), 'ferry_station')
  end)
end)
