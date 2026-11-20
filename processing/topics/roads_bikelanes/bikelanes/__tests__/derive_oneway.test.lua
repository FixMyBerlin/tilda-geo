local derive_oneway = require('topics.roads_bikelanes.bikelanes.derive_oneway')

describe('derive_oneway', function()
  local no_implicit = { implicitOneWay = false }

  it('returns car_not_bike when oneway:bicycle=no and oneway=yes', function()
    assert.are.equal(derive_oneway({
      oneway = 'yes',
      ['oneway:bicycle'] = 'no',
    }, no_implicit), 'car_not_bike')
  end)

  it('returns car_not_bike when oneway:bicycle=no and oneway=-1', function()
    assert.are.equal(derive_oneway({
      oneway = '-1',
      ['oneway:bicycle'] = 'no',
    }, no_implicit), 'car_not_bike')
  end)

  it('returns assumed_no for bidirectional residential roads', function()
    assert.are.equal(derive_oneway({
      highway = 'residential',
    }, no_implicit), 'assumed_no')
  end)

  it('returns yes when oneway:bicycle=yes', function()
    assert.are.equal(derive_oneway({
      oneway = 'no',
      ['oneway:bicycle'] = 'yes',
    }, no_implicit), 'yes')
  end)

  it('reads oneway=-1 as an explicit oneway (`1` is `yes` after normalize_oneway_tags)', function()
    assert.are.equal(derive_oneway({ highway = 'cycleway', oneway = '-1' }, no_implicit), 'yes')
    assert.are.equal(derive_oneway({ highway = 'path', ['oneway:bicycle'] = '-1' }, no_implicit), 'yes')
  end)

  it('reads cycleway:<side>:oneway=-1 as an explicit oneway', function()
    assert.are.equal(derive_oneway({ highway = 'cycleway', _side = 'left', oneway = '-1' }, no_implicit), 'yes')
  end)

  it('lets the category decide for lanes and tracks tagged on the road without a tag', function()
    -- The category decides; for tracks next to a road that is one-way (`_adjoining`), see create_subcategories_adjoining_or_isolated.
    assert.are.equal(derive_oneway({ highway = 'cycleway', _side = 'left' }, { implicitOneWay = true }), 'implicit_yes')
    assert.are.equal(derive_oneway({ highway = 'cycleway', _side = 'right' }, no_implicit), 'assumed_no')
    assert.are.equal(derive_oneway({ highway = 'cycleway', _side = 'right', oneway = 'no' }, no_implicit), 'no')
  end)

  it('keeps the category default on own geometries without a tag', function()
    assert.are.equal(derive_oneway({ highway = 'cycleway', _side = 'self' }, no_implicit), 'assumed_no')
    assert.are.equal(derive_oneway({ highway = 'cycleway', _side = 'self' }, { implicitOneWay = true }), 'implicit_yes')
  end)
end)
