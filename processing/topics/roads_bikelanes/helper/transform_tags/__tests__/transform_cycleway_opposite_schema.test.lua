describe('transform_cycleway_opposite_schema', function()
  local compare_tables = require('topics.helper.compare_tables')
  local transform_cycleway_opposite_schema = require('topics.roads_bikelanes.helper.transform_tags.transform_cycleway_opposite_schema')
  local osm2pgsql = require('topics.helper.osm2pgsql')

  it('do nothing when cycleway is lane', function()
    local input = { ['cycleway'] = 'lane' }
    transform_cycleway_opposite_schema(input)
    assert.are.same(input, input)
  end)

  it('handle opposite when oneway is yes', function()
    local input = { ['cycleway'] = 'opposite', ['oneway'] = 'yes' }
    local expectedResult = { ['cycleway'] = 'no', ['oneway:bicycle'] = 'no', ['oneway'] = 'yes' }
    transform_cycleway_opposite_schema(input)
    assert.are.same(input, expectedResult)
  end)

  it('handle opposite_lane when oneway is yes', function()
    local input = { ['cycleway'] = 'opposite_lane', ['oneway'] = 'yes' }
    local expectedResult = {
      ['cycleway:right'] = 'no',
      ['cycleway:left'] = 'lane',
      ['oneway:bicycle'] = 'no',
      ['oneway'] = 'yes',
    }
    transform_cycleway_opposite_schema(input)
    assert.are.same(input, expectedResult)
  end)

  it('handle opposite_track when oneway is yes', function()
    local input = { ['cycleway'] = 'opposite_track', ['oneway'] = 'yes' }
    local expectedResult = {
      ['cycleway:right'] = 'no',
      ['cycleway:left'] = 'track',
      ['oneway:bicycle'] = 'no',
      ['oneway'] = 'yes',
    }
    transform_cycleway_opposite_schema(input)
    assert.are.same(input, expectedResult)
  end)
end)
