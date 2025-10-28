describe("SanitizeTrafficSign", function()
  require('init')
  require("SanitizeTrafficSign")

  -- Cleanup
  it('renames `no` to `none`', function()
    assert.are.same(SanitizeTrafficSign("no"), "none")
  end)

  it('renames `DE:SPACE` to `DE:`', function()
    assert.are.same(SanitizeTrafficSign("DE: 123"), "DE:123")
  end)

  it('renames `DE234` to `DE:234`', function()
    assert.are.same(SanitizeTrafficSign("DE234"), "DE:234")
  end)

  it('renames `DE1010` to `DE:1010`', function()
    assert.are.same(SanitizeTrafficSign("DE1010"), "DE:1010")
  end)

  it('renames `D:234` to `DE:234`', function()
    assert.are.same(SanitizeTrafficSign("D:234"), "DE:234")
  end)

  it('renames `de:234` to `DE:234`', function()
    assert.are.same(SanitizeTrafficSign("de:234"), "DE:234")
  end)

  it('renames `234` to `DE:234`', function()
    assert.are.same(SanitizeTrafficSign("234"), "DE:234")
  end)

  it('renames `1010` to `DE:1010`', function()
    assert.are.same(SanitizeTrafficSign("1010"), "DE:1010")
  end)

  it('renames `DE.234` to `DE:234`', function()
    assert.are.same(SanitizeTrafficSign("DE.234"), "DE:234")
  end)

  it('cleans spaces `DE:123, 1010; 234` to `DE:123,1010;234`', function()
    assert.are.same(SanitizeTrafficSign("DE:123, 1010; 234"), "DE:123,1010;234")
  end)

  -- Allow
  it('allows `DE:234`', function()
    assert.are.same(SanitizeTrafficSign("DE:234"), "DE:234")
  end)

  it('allows `DE:1010`', function()
    assert.are.same(SanitizeTrafficSign("DE:1010"), "DE:1010")
  end)

  it('allows `none` as value', function()
    assert.are.same(SanitizeTrafficSign("none"), "none")
  end)

  it('handles nil', function()
    assert.are.same(SanitizeTrafficSign(nil), nil)
  end)

  it('handles descriptive German traffic signs with forward slash', function()
    assert.are.same(SanitizeTrafficSign("Rad/Fuß: Fußgänger haben Vorrang."), "Rad/Fuß: Fußgänger haben Vorrang.")
  end)
end)
