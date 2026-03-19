describe('derive_smoothness', function()
  require('init')
  local derive_smoothness = require('derive_smoothness')

  it('return nil for surface nil', function()
    local result = derive_smoothness({})
    assert.are.same(result,
      { smoothness = nil, smoothness_source = nil, smoothness_confidence = nil }
    )
  end)

  it('return nil for surface unknown_typo', function()
    local result = derive_smoothness({ surface = 'unknown_typo' })
    assert.are.same(result,
      { smoothness = nil, smoothness_source = nil, smoothness_confidence = nil }
    )
  end)

  it('return bad for surface dirt', function()
    local result = derive_smoothness({ surface = 'dirt' })
    assert.are.same(result,
      { smoothness = 'bad', smoothness_source = 'surface_to_smoothness', smoothness_confidence = 'medium' }
    )
  end)

  it('return bad for weird surface', function()
    local result = derive_smoothness({ surface = 'sett;paving_stones;cobblestone:flattened' })
    assert.are.same(result,
      { smoothness = 'bad', smoothness_source = 'surface_to_smoothness', smoothness_confidence = 'medium' }
    )
  end)

  it('respect smoothness precedence', function()
    local result = derive_smoothness({ smoothness = 'good', surface = 'sett;paving_stones;cobblestone:flattened' })
    assert.are.same(result,
      { smoothness = 'good', smoothness_source = 'tag', smoothness_confidence = 'high' }
    )
  end)

  it('respect MTB scale', function()
    local result = derive_smoothness({ smoothness = 'wierd smoothness', ['mtb:scale'] = '0+' })
    assert.are.same(result,
      { smoothness = 'bad', smoothness_source = 'mtb:scale_to_smoothness', smoothness_confidence = 'medium' }
    )
  end)
end)
