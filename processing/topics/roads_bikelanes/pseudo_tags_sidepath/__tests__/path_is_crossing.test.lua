local path_is_crossing = require('topics.roads_bikelanes.pseudo_tags_sidepath.path_is_crossing')

describe('path_is_crossing', function()
  it('flags pedestrian footway crossings without bicycle tags (roads.road footway_crossing)', function()
    assert.is_true(path_is_crossing({ highway = 'footway', footway = 'crossing' }))
    assert.is_true(path_is_crossing({ highway = 'footway', footway = 'traffic_island' }))
  end)

  it('flags cycleway and path crossings', function()
    assert.is_true(path_is_crossing({ highway = 'cycleway', cycleway = 'crossing' }))
    assert.is_true(path_is_crossing({ highway = 'path', path = 'crossing' }))
  end)

  it('flags the bike-only is_crossing_pattern extra (cycleway lane crossing)', function()
    assert.is_true(path_is_crossing({ highway = 'cycleway', cycleway = 'lane', lane = 'crossing' }))
  end)

  it('is false for sidewalks and ordinary paths', function()
    assert.is_false(path_is_crossing({ highway = 'footway', footway = 'sidewalk' }))
    assert.is_false(path_is_crossing({ highway = 'path', bicycle = 'designated' }))
    assert.is_false(path_is_crossing({ highway = 'cycleway' }))
  end)
end)
