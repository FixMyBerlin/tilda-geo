describe('derive_width_with_fallback', function()
  require('topics.helper.osm2pgsql')
  local derive_width_with_fallback = require('topics.helper.derive_width_with_fallback')

  it('uses the width tag with high confidence', function()
    assert.are.same(derive_width_with_fallback({ highway = 'primary', width = '12.5', ['source:width'] = 'ALKIS' }), {
      width = 12.5,
      width_source = 'ALKIS',
      width_confidence = 'high',
    })
  end)

  it('uses est_width before the highway default', function()
    assert.are.same(derive_width_with_fallback({ highway = 'primary', est_width = '9' }), {
      width = 9,
      width_source = nil,
      width_confidence = 'medium',
    })
  end)

  it('falls back to the highway default with low confidence', function()
    assert.are.same(derive_width_with_fallback({ highway = 'primary' }), {
      width = 18,
      width_source = 'highway_default',
      width_confidence = 'low',
    })
  end)

  it('uses the oneway default for main roads', function()
    assert.are.same(derive_width_with_fallback({ highway = 'secondary', oneway = 'yes' }), {
      width = 9,
      width_source = 'highway_default_and_oneway',
      width_confidence = 'low',
    })
    assert.are.equal(derive_width_with_fallback({ highway = 'secondary' }).width, 14)
    assert.are.equal(derive_width_with_fallback({ highway = 'tertiary', oneway = 'yes' }).width, 7)
    assert.are.equal(derive_width_with_fallback({ highway = 'tertiary' }).width, 10)
  end)

  it('uses the same default for other roads regardless of oneway', function()
    local oneway = derive_width_with_fallback({ highway = 'residential', oneway = 'yes' })
    assert.are.equal(oneway.width, 8)
    assert.are.equal(oneway.width_source, 'highway_default')
    assert.are.equal(derive_width_with_fallback({ highway = 'residential', oneway = 'no' }).width, 8)
  end)

  it('falls back to 10 m for unknown highway types', function()
    assert.are.same(derive_width_with_fallback({ highway = 'unknown' }), {
      width = 10,
      width_source = 'highway_default',
      width_confidence = 'low',
    })
  end)

  it('falls back when the width tag is unparsable', function()
    assert.are.equal(derive_width_with_fallback({ highway = 'residential', width = 'breit' }).width_confidence, 'low')
  end)
end)
