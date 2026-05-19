describe('derive_surface', function()
  local derive_surface = require('topics.helper.derive_surface')

  it('return correct surface_source, surface_confidence for tag', function()
    local result = derive_surface({ surface = 'asphalt' })
    assert.are.same(result,
      { surface = 'asphalt', surface_source = 'tag', surface_confidence = 'high' }
    )
  end)

  it('return correct surface_source, surface_confidence for nil', function()
    local result = derive_surface({})
    assert.are.same(result,
      { surface = nil, surface_source = nil, surface_confidence = nil }
    )
  end)
end)
