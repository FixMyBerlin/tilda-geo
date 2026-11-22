local inclusion_rules = require('topics.roads_bikelanes.routing_infra.inclusion_rules')

---@return { source_table: string, side: string, tags: table }
local function on_side(segment, side)
  return { source_table = segment.source_table, tags = segment.tags, side = side }
end

describe('inclusion_rules.prohibited_highway', function()
  it('prohibits motorway and trunk, own or parent', function()
    assert.is_true(inclusion_rules.prohibited_highway({ highway = 'motorway_link' }))
    assert.is_true(inclusion_rules.prohibited_highway({ highway = 'cycleway', parent_road = 'trunk' }))
    assert.is_false(inclusion_rules.prohibited_highway({ highway = 'primary', bicycle = 'no' })) -- stays, routers filter on access_bicycle
  end)

  it('prohibits the carriageway of a motorroad, also with bicycle=yes', function()
    assert.is_true(inclusion_rules.prohibited_highway({ highway = 'primary', motorroad = 'yes' }))
    assert.is_true(inclusion_rules.prohibited_highway({ highway = 'primary', motorroad = 'yes', bicycle = 'yes' }))
    assert.is_false(inclusion_rules.prohibited_highway({ highway = 'primary', motorroad = 'no' }))
  end)
end)

describe('inclusion_rules.access_bicycle', function()
  local access_bicycle = inclusion_rules.access_bicycle
  local road = { highway = 'secondary', bicycle = 'use_sidepath', ['cycleway:right'] = 'track' }

  it('flags the carriageway edge with the road bicycle access', function()
    local segment = { source_table = 'roads', tags = road }
    assert.are.equal('use_sidepath', access_bicycle(on_side(segment, 'right'), road))
  end)

  it('does not copy the parent road access onto a centerline-derived lane', function()
    local segment = { source_table = 'bikelanes', tags = { category = 'cycleway_adjoining' } }
    assert.is_nil(access_bicycle(on_side(segment, 'right'), road))
    assert.is_nil(access_bicycle(on_side(segment, 'left'), { highway = 'secondary', bicycle = 'no' }))
  end)

  it('reads the way itself for self segments', function()
    local path = { highway = 'footway', bicycle = 'dismount' }
    local segment = { source_table = 'roadsPathClasses', tags = { category = 'mixedTrafficFoot' } }
    assert.are.equal('dismount', access_bicycle(on_side(segment, 'self'), path))
    local cycleway = { highway = 'cycleway', bicycle = 'designated' }
    local virtual_self = { source_table = 'bikelanes', tags = { category = 'cycleway_isolated' } }
    assert.are.equal('designated', access_bicycle(on_side(virtual_self, 'self'), cycleway))
  end)
end)

describe('inclusion_rules.access_bicycle values', function()
  local access_bicycle = inclusion_rules.access_bicycle

  it('publishes the values that do not allow cycling', function()
    for _, value in ipairs({ 'no', 'destination', 'private', 'customers', 'delivery', 'permit' }) do
      local segment = { source_table = 'roadsPathClasses', tags = {} }
      assert.are.equal(value, access_bicycle(on_side(segment, 'self'), { highway = 'footway', bicycle = value }), value)
    end
  end)

  it('resolves bicycle -> vehicle -> access', function()
    local segment = { source_table = 'roads', tags = {} }
    assert.are.equal('destination', access_bicycle(on_side(segment, 'self'), { highway = 'residential', vehicle = 'destination' }))
    assert.are.equal('private', access_bicycle(on_side(segment, 'self'), { highway = 'residential', access = 'private' }))
    assert.are.equal('yes', access_bicycle(on_side(segment, 'self'), { highway = 'residential', vehicle = 'destination', bicycle = 'yes' }))
  end)

  it('is empty without an access tag or with an unlisted value', function()
    local segment = { source_table = 'roads', tags = {} }
    assert.is_nil(access_bicycle(on_side(segment, 'self'), { highway = 'residential' }))
    assert.is_nil(access_bicycle(on_side(segment, 'self'), { highway = 'residential', vehicle = 'psv' }))
  end)

  it('collapses agricultural and forestry into agricultural_or_forestry', function()
    local segment = { source_table = 'roads', tags = {} }
    assert.are.equal('agricultural_or_forestry', access_bicycle(on_side(segment, 'self'), { highway = 'track', access = 'agricultural' }))
    assert.are.equal('agricultural_or_forestry', access_bicycle(on_side(segment, 'self'), { highway = 'track', vehicle = 'agricultural;forestry' }))
  end)
end)

describe('inclusion_rules.unpublished_bicycle_access', function()
  local unpublished = inclusion_rules.unpublished_bicycle_access
  local segment = { source_table = 'roads', tags = {} }

  it('is true for a value access_bicycle cannot publish', function()
    assert.is_true(unpublished(on_side(segment, 'self'), { highway = 'service', vehicle = 'psv' }))
    assert.is_true(unpublished(on_side(segment, 'self'), { highway = 'residential', vehicle = 'delivery;destination' }))
    assert.is_true(unpublished(on_side(segment, 'self'), { highway = 'track', access = 'unknown' }))
  end)

  it('is false without a value or with a published one', function()
    assert.is_false(unpublished(on_side(segment, 'self'), { highway = 'residential' }))
    assert.is_false(unpublished(on_side(segment, 'self'), { highway = 'residential', vehicle = 'destination' }))
    assert.is_false(unpublished(on_side(segment, 'self'), { highway = 'track', access = 'forestry' }))
    assert.is_false(unpublished(on_side(segment, 'self'), { highway = 'primary', bicycle = 'no' }))
  end)

  it('ignores the carriageway access on a lane', function()
    local lane = { source_table = 'bikelanes', tags = {} }
    assert.is_false(unpublished(on_side(lane, 'right'), { highway = 'primary', vehicle = 'psv' }))
  end)
end)
