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
end)
