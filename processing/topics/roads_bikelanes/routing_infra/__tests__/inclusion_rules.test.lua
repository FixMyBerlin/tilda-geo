local inclusion_rules = require('topics.roads_bikelanes.routing_infra.inclusion_rules')
local exclude_segment = inclusion_rules.exclude_segment

describe('inclusion_rules.exclude_segment', function()
  it('keeps segments with allowed (or no) bicycle access', function()
    assert.is_false(exclude_segment({ bicycle = 'yes' }))
    assert.is_false(exclude_segment({ bicycle = 'designated' }))
    assert.is_false(exclude_segment({ bicycle = 'permissive' }))
    assert.is_false(exclude_segment({ bicycle = 'use_sidepath' }))
    assert.is_false(exclude_segment({ bicycle = 'optional_sidepath' }))
    assert.is_false(exclude_segment({ bicycle = 'dismount' }))
    assert.is_false(exclude_segment({}))
  end)

  it('excludes segments where cycling is not allowed', function()
    assert.is_true(exclude_segment({ bicycle = 'no' }))
    assert.is_true(exclude_segment({ bicycle = 'private' }))
  end)

  it('resolves bicycle access through the vehicle/access fallback chain', function()
    assert.is_true(exclude_segment({ access = 'no' }))
    assert.is_true(exclude_segment({ vehicle = 'no' }))
    assert.is_false(exclude_segment({ vehicle = 'no', bicycle = 'yes' })) -- explicit bicycle wins
  end)

  it('excludes informal paths only when bicycle access is absent', function()
    assert.is_true(exclude_segment({ informal = 'yes' }))
    assert.is_false(exclude_segment({ informal = 'yes', bicycle = 'permissive' }))
    assert.is_false(exclude_segment({ informal = 'yes', bicycle = 'yes' }))
    assert.is_false(exclude_segment({ informal = 'yes', bicycle = 'designated' }))
  end)

  it('excludes cycling-prohibited highways regardless of bikelane category', function()
    assert.is_true(exclude_segment({ highway = 'trunk', cycleway = 'lane' }))
    assert.is_true(exclude_segment({ highway = 'motorway' }))
    assert.is_true(exclude_segment({ parent_road = 'trunk', highway = 'cycleway' }))
    assert.is_false(exclude_segment({ highway = 'residential' }))
  end)
end)

describe('inclusion_rules.access_bicycle', function()
  local access_bicycle = inclusion_rules.access_bicycle
  local road = { highway = 'secondary', bicycle = 'use_sidepath', ['cycleway:right'] = 'track' }

  it('flags the carriageway edge with the road bicycle access', function()
    local segment = { source_table = 'roads', tags = road }
    assert.are.equal('use_sidepath', access_bicycle(segment, 'right', road))
  end)

  it('does not copy the parent road access onto a centerline-derived lane', function()
    local segment = { source_table = 'bikelanes', tags = { category = 'cycleway_adjoining' } }
    assert.is_nil(access_bicycle(segment, 'right', road))
    assert.is_nil(access_bicycle(segment, 'left', { highway = 'secondary', bicycle = 'no' }))
  end)

  it('reads the way itself for self segments', function()
    local path = { highway = 'footway', bicycle = 'dismount' }
    local segment = { source_table = 'roadsPathClasses', tags = { category = 'mixedTrafficFoot' } }
    assert.are.equal('dismount', access_bicycle(segment, 'self', path))
    local cycleway = { highway = 'cycleway', bicycle = 'designated' }
    local virtual_self = { source_table = 'bikelanes', tags = { category = 'cycleway_isolated' } }
    assert.are.equal('designated', access_bicycle(virtual_self, 'self', cycleway))
  end)
end)
