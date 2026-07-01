describe('landuse allowed_values.matched_value', function()
  local allowed = require('topics.landcover.landuse.helper.allowed_values')
  local matched = allowed.matched_value

  it('returns the landuse value when allowed', function()
    assert.are.equal(matched({ landuse = 'residential' }), 'residential')
  end)

  it('returns the amenity value when allowed (normalised onto landuse)', function()
    assert.are.equal(matched({ amenity = 'school' }), 'school')
  end)

  it('returns the leisure value when allowed (normalised onto landuse)', function()
    assert.are.equal(matched({ leisure = 'park' }), 'park')
  end)

  it('prefers landuse over amenity over leisure', function()
    assert.are.equal(
      matched({ landuse = 'residential', amenity = 'school', leisure = 'park' }),
      'residential'
    )
  end)

  it('returns the matched value, not a non-allowlisted tag that happens to be present', function()
    -- The leak case: admitted via leisure=park, but landuse=grass is not allowed -> must store park.
    assert.are.equal(matched({ landuse = 'grass', leisure = 'park' }), 'park')
  end)

  it('returns nil when nothing matches', function()
    assert.is_nil(matched({ landuse = 'grass' }))
    assert.is_nil(matched({ amenity = 'restaurant' }))
    assert.is_nil(matched({}))
  end)
end)
