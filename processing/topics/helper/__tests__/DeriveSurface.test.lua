describe("DeriveSurface", function()
  require('init')
  require("DeriveSurface")

  it('return correct surface_source, surface_confidence for tag', function()
    local result = DeriveSurface({ surface = "asphalt" })
    assert.are.same(result,
      { surface = "asphalt", surface_source = "tag", surface_confidence = "high" }
    )
  end)

  it('return correct surface_source, surface_confidence for nil', function()
    local result = DeriveSurface({})
    assert.are.same(result,
      { surface = nil, surface_source = nil, surface_confidence = nil }
    )
  end)
end)
