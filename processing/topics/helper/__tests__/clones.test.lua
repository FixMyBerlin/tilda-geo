describe('structured_clone', function()
  require('init')
  local CLONE = require('clones')

  it('clones a flat table', function()
    local original = { a = 1, b = 2, c = 3 }
    local clone = CLONE.structured_clone(original)
    assert.are.same(clone, original)
    assert.are_not.equal(clone, original) -- Ensure it's a new table
  end)

  it('clones a nested table', function()
    local original = { a = 1, b = { c = 2, d = { e = 3 } } }
    local clone = CLONE.structured_clone(original)
    assert.are.same(clone, original)
    assert.are_not.equal(clone.b, original.b) -- Ensure nested tables are new
    assert.are_not.equal(clone.b.d, original.b.d)
  end)

  it('handles non-table values', function()
    assert.are.equal(CLONE.structured_clone(42), 42)
    assert.are.equal(CLONE.structured_clone('hello'), 'hello')
    assert.are.equal(CLONE.structured_clone(true), true)
  end)

  it('handles empty tables', function()
    local original = {}
    local clone = CLONE.structured_clone(original)
    assert.are.same(clone, original)
    assert.are_not.equal(clone, original) -- Ensure it's a new table
  end)

  it('handles tables with mixed keys', function()
    local original = { [1] = 'a', b = 'c', [true] = 'd' }
    local clone = CLONE.structured_clone(original)
    assert.are.same(clone, original)
    assert.are_not.equal(clone, original) -- Ensure it's a new table
  end)
end)
