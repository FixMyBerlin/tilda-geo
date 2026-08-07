require('topics.helper.osm2pgsql')
local adjoining_context = require('topics.roads_bikelanes.pseudo_tags_sidepath.adjoining_context')

local has_sidepath_context = adjoining_context.has_sidepath_context
local derive_adjoining_context = adjoining_context.derive_adjoining_context

describe('adjoining_context.has_sidepath_context', function()
  it('is true for the estimation pseudo tag', function()
    assert.is_true(has_sidepath_context({ _is_sidepath = 'assumed_yes' }, {}))
  end)

  it('is true for any explicit sidepath tagging (via category_is_sidepath)', function()
    assert.is_true(has_sidepath_context({}, { footway = 'sidewalk' }))
    assert.is_true(has_sidepath_context({}, { is_sidepath = 'yes' }))
    assert.is_true(has_sidepath_context({}, { cycleway = 'sidepath' }))
    assert.is_true(has_sidepath_context({}, { path = 'sidewalk' }))
    assert.is_true(has_sidepath_context({}, { parent_road = 'secondary' }))
  end)

  it('is false without any sidepath signal', function()
    assert.is_false(has_sidepath_context({}, {}))
    assert.is_false(has_sidepath_context({ _is_sidepath = 'no' }, { highway = 'cycleway' }))
  end)
end)

describe('adjoining_context.derive_adjoining_context', function()
  it('reads the _sidepath_* pseudo tags', function()
    local result = derive_adjoining_context(
      { _is_sidepath = 'assumed_yes', _sidepath_adjoining_road = 'secondary', _sidepath_adjoining_maxspeed = '50' },
      {}
    )
    assert.are.equal('secondary', result.adjoining_road)
    assert.are.equal(50, result.adjoining_maxspeed)
  end)

  it('falls back to the explicit is_sidepath:of tag for the road', function()
    local result = derive_adjoining_context({ _is_sidepath = 'assumed_yes' }, { ['is_sidepath:of'] = 'primary' })
    assert.are.equal('primary', result.adjoining_road)
    assert.is_nil(result.adjoining_maxspeed)
  end)

  it('maps is_sidepath:of through TILDA road classification then the roads.road allowlist', function()
    local result = derive_adjoining_context({ _is_sidepath = 'assumed_yes' }, { ['is_sidepath:of'] = 'service' })
    assert.are.equal('service_road', result.adjoining_road)

    result = derive_adjoining_context({ _is_sidepath = 'assumed_yes' }, { ['is_sidepath:of'] = 'road' })
    assert.are.equal('unspecified_road', result.adjoining_road)
  end)

  it('drops is_sidepath:of typos and trunk (not in roads.road)', function()
    assert.are.same({}, derive_adjoining_context({ _is_sidepath = 'assumed_yes' }, { ['is_sidepath:of'] = 'reidential' }))
    assert.are.same({}, derive_adjoining_context({ _is_sidepath = 'assumed_yes' }, { ['is_sidepath:of'] = 'trunk' }))
    assert.are.same({}, derive_adjoining_context({ _is_sidepath = 'assumed_yes' }, { ['is_sidepath:of'] = 'trunk_link' }))
  end)

  it('drops is_sidepath:of path classes and falls through to the CSV (not a motor road)', function()
    assert.are.same({}, derive_adjoining_context({}, { highway = 'footway', ['is_sidepath:of'] = 'cycleway' }))
    assert.are.same(
      { adjoining_road = 'tertiary', adjoining_maxspeed = 50 },
      derive_adjoining_context(
        { _sidepath_adjoining_road = 'tertiary', _sidepath_adjoining_maxspeed = '50' },
        { highway = 'footway', ['is_sidepath:of'] = 'cycleway' }
      )
    )
    assert.are.equal('service_road', adjoining_context.sanitize_is_sidepath_of('service'))
  end)

  it('does not fall back to is_sidepath:of on crossings (that tag is the side street)', function()
    assert.are.same(
      {},
      derive_adjoining_context({}, { highway = 'footway', footway = 'crossing', ['is_sidepath:of'] = 'residential' })
    )
  end)

  it('still uses CSV adjoining on a crossing when the estimator found a crossed street', function()
    local result = derive_adjoining_context(
      { _sidepath_adjoining_road = 'secondary', _sidepath_adjoining_maxspeed = '50' },
      { highway = 'footway', footway = 'crossing', ['is_sidepath:of'] = 'residential' }
    )
    assert.are.equal('secondary', result.adjoining_road)
    assert.are.equal(50, result.adjoining_maxspeed)
  end)

  it('lets a usable is_sidepath:of override the CSV, and drops the other class maxspeed', function()
    local result = derive_adjoining_context(
      { _is_sidepath = 'assumed_yes', _sidepath_adjoining_road = 'residential_priority_road', _sidepath_adjoining_maxspeed = '30' },
      { ['is_sidepath:of'] = 'primary' }
    )
    assert.are.equal('primary', result.adjoining_road)
    assert.is_nil(result.adjoining_maxspeed)
  end)

  it('keeps the coarser :of value when the CSV only adds residential_priority_road', function()
    local result = derive_adjoining_context(
      { _is_sidepath = 'assumed_yes', _sidepath_adjoining_road = 'residential_priority_road', _sidepath_adjoining_maxspeed = '30' },
      { ['is_sidepath:of'] = 'residential' }
    )
    assert.are.equal('residential', result.adjoining_road)
    assert.is_nil(result.adjoining_maxspeed)
  end)

  it('keeps CSV maxspeed when :of and CSV are the same class', function()
    local result = derive_adjoining_context(
      { _sidepath_adjoining_road = 'secondary', _sidepath_adjoining_maxspeed = '50' },
      { ['is_sidepath:of'] = 'secondary' }
    )
    assert.are.equal('secondary', result.adjoining_road)
    assert.are.equal(50, result.adjoining_maxspeed)
  end)

  it('falls through to CSV when is_sidepath:of is not a usable road class', function()
    local result = derive_adjoining_context(
      { _sidepath_adjoining_road = 'tertiary', _sidepath_adjoining_maxspeed = '50' },
      { ['is_sidepath:of'] = 'trunk' }
    )
    assert.are.equal('tertiary', result.adjoining_road)
    assert.are.equal(50, result.adjoining_maxspeed)
  end)

  it('parses the maxspeed CSV value with tonumber (it is pre-sanitized to a number)', function()
    local result = derive_adjoining_context({ _is_sidepath = 'assumed_yes', _sidepath_adjoining_maxspeed = '30' }, {})
    assert.are.equal(30, result.adjoining_maxspeed)
  end)

  it('fills adjoining from CSV even without sidepath context (danger-from-nearby-traffic)', function()
    local result = derive_adjoining_context({ _sidepath_adjoining_road = 'secondary' }, {})
    assert.are.equal('secondary', result.adjoining_road)
  end)

  it('does not attach adjoining_* to Fahrradstraße (own traffic, not a neighbour)', function()
    assert.are.same(
      {},
      derive_adjoining_context(
        { bicycle_road = 'yes', _sidepath_adjoining_road = 'residential' },
        { bicycle_road = 'yes' }
      )
    )
    assert.are.same(
      {},
      derive_adjoining_context(
        { _sidepath_adjoining_road = 'residential' },
        { traffic_sign = 'DE:244.1' }
      )
    )
  end)

  it('does not attach adjoining_* to Fußgängerzone with bicycle allowed', function()
    assert.are.same(
      {},
      derive_adjoining_context(
        { highway = 'pedestrian', bicycle = 'yes', _sidepath_adjoining_road = 'residential' },
        { highway = 'pedestrian', bicycle = 'yes' }
      )
    )
  end)

  it('returns {} when nothing is available', function()
    assert.are.same({}, derive_adjoining_context({ _is_sidepath = 'assumed_yes' }, {}))
  end)
end)
