require('topics.helper.osm2pgsql')
local resolve_motor_road_context = require('topics.roads_bikelanes.routing_infra.resolve_motor_road_context')

describe('resolve_motor_road_context (sidepath branch)', function()
  it('resolves adjoining road and maxspeed from _sidepath_* pseudo tags', function()
    local segment = { source_table = 'roadsPathClasses', tags = { highway = 'cycleway', footway = 'sidewalk' } }
    local context = {
      object_tags = {
        highway = 'cycleway',
        footway = 'sidewalk',
        _is_sidepath = 'assumed_yes',
        _sidepath_adjoining_road = 'secondary',
        _sidepath_adjoining_maxspeed = '50',
      },
    }
    local result = resolve_motor_road_context(segment, context)
    assert.are.equal(result.sidepath, 'yes')
    assert.are.equal(result.adjoining_road, 'secondary')
    assert.are.equal(result.adjoining_maxspeed, 50)
  end)

  it('prefers explicit adjoining_road / adjoining_maxspeed tags over pseudo tags', function()
    local segment = {
      source_table = 'roadsPathClasses',
      tags = {
        highway = 'cycleway',
        footway = 'sidewalk',
        adjoining_road = 'primary',
        adjoining_maxspeed = 70,
      },
    }
    local context = {
      object_tags = {
        highway = 'cycleway',
        footway = 'sidewalk',
        _is_sidepath = 'assumed_yes',
        _sidepath_adjoining_road = 'secondary',
        _sidepath_adjoining_maxspeed = '50',
      },
    }
    local result = resolve_motor_road_context(segment, context)
    assert.are.equal(result.sidepath, 'yes')
    assert.are.equal(result.adjoining_road, 'primary')
    assert.are.equal(result.adjoining_maxspeed, 70)
  end)

  it('marks a path with no sidepath context as sidepath=no but still copies CSV adjoining', function()
    local segment = { source_table = 'roadsPathClasses', tags = { highway = 'path' } }
    local context = {
      object_tags = {
        highway = 'path',
        _sidepath_adjoining_road = 'residential',
        _sidepath_adjoining_maxspeed = '30',
      },
    }
    local result = resolve_motor_road_context(segment, context)
    assert.are.equal(result.sidepath, 'no')
    assert.are.equal(result.adjoining_road, 'residential')
    assert.are.equal(result.adjoining_maxspeed, 30)
  end)

  it('copies adjoining_road from the bikelanes source row on bikelanes edges', function()
    local segment = {
      source_table = 'bikelanes',
      tags = {
        highway = 'cycleway',
        adjoining_road = 'secondary',
        adjoining_maxspeed = 50,
      },
    }
    local context = {
      object_tags = { highway = 'cycleway' },
      shared_result_tags = { road = 'cycleway' },
    }
    local result = resolve_motor_road_context(segment, context)
    assert.are.equal(result.sidepath, 'yes')
    assert.are.equal(result.adjoining_road, 'secondary')
    assert.are.equal(result.adjoining_maxspeed, 50)
  end)

  it('uses the parent road as adjoining context on left/right lanes', function()
    local segment = {
      source_table = 'bikelanes',
      side = 'right',
      tags = { highway = 'cycleway', parent_road = 'residential_priority_road', parent_maxspeed = 30 },
    }
    local context = {
      object_tags = { highway = 'residential', priority_road = 'designated' },
      shared_result_tags = { road = 'residential_priority_road' },
    }
    local result = resolve_motor_road_context(segment, context)
    assert.are.equal(result.sidepath, 'yes')
    assert.are.equal(result.adjoining_road, 'residential_priority_road')
    assert.are.equal(result.adjoining_maxspeed, 30)
  end)

  it('leaves adjoining empty on self bikelanes edges when bikelanes has none', function()
    local segment = {
      source_table = 'bikelanes',
      side = 'self',
      tags = { highway = 'cycleway', parent_road = 'residential', parent_maxspeed = 30 },
    }
    local context = {
      object_tags = { highway = 'cycleway' },
      shared_result_tags = { road = 'cycleway' },
    }
    local result = resolve_motor_road_context(segment, context)
    assert.is_nil(result.adjoining_road)
    assert.is_nil(result.adjoining_maxspeed)
  end)

  it('carriageway exposes own maxspeed, not adjoining_maxspeed', function()
    local segment = {
      source_table = 'roads',
      tags = { highway = 'residential', maxspeed = '30' },
    }
    local context = { object_tags = { highway = 'residential', maxspeed = '30' } }
    local result = resolve_motor_road_context(segment, context)
    assert.are.equal(result.maxspeed, 30)
    assert.is_nil(result.adjoining_maxspeed)
    assert.is_nil(result.own_highway)
  end)
end)
