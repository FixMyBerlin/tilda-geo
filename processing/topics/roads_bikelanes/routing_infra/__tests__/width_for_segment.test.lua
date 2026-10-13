describe('width_for_segment', function()
  require('topics.helper.osm2pgsql')
  local width_for_segment = require('topics.roads_bikelanes.routing_infra.width_for_segment')

  local function carriageway(object_tags)
    return { segment_id = 'way/1', source_id = 'way/1', source_table = 'roads', tags = object_tags }
  end

  it('parses the mapped width of a carriageway edge', function()
    local object_tags = { highway = 'primary', width = '11 m' }
    assert.are.equal(width_for_segment(carriageway(object_tags), object_tags, 'self'), 11)
  end)

  it('uses est_width of a carriageway edge', function()
    local object_tags = { highway = 'primary', est_width = '12' }
    assert.are.equal(width_for_segment(carriageway(object_tags), object_tags, 'self'), 12)
  end)

  it('falls back to the highway default on carriageway and path edges', function()
    local road_tags = { highway = 'primary', oneway = 'yes' }
    assert.are.equal(width_for_segment(carriageway(road_tags), road_tags, 'self'), 12)

    local path_tags = { highway = 'path' }
    local path = { segment_id = 'way/1', source_id = 'way/1', source_table = 'roadsPathClasses', tags = path_tags }
    assert.are.equal(width_for_segment(path, path_tags, 'self'), 2.5)
  end)

  it('keeps the mapped width of a bike lane and has no default for left/right lanes', function()
    local object_tags = { highway = 'primary' }
    local lane = { segment_id = 'way/1/cycleway/right', source_id = 'way/1/cycleway/right', source_table = 'bikelanes', tags = { width = 1.6 } }
    assert.are.equal(width_for_segment(lane, object_tags, 'right'), 1.6)

    lane.tags = {}
    assert.are.equal(width_for_segment(lane, object_tags, 'right'), nil)
  end)

  it('has no default for a Mittellage lane inside the carriageway', function()
    local object_tags = { highway = 'primary' }
    local lane = { segment_id = 'way/1/cycleway/self', source_id = 'way/1', source_table = 'bikelanes', tags = {} }
    assert.are.equal(width_for_segment(lane, object_tags, 'self'), nil)
  end)

  it('falls back to the highway default for bike infra that is the way itself', function()
    local object_tags = { highway = 'residential', bicycle_road = 'yes' }
    local bicycle_road = { segment_id = 'way/1', source_id = 'way/1', source_table = 'bikelanes', tags = {} }
    assert.are.equal(width_for_segment(bicycle_road, object_tags, 'self'), 8)
  end)
end)
