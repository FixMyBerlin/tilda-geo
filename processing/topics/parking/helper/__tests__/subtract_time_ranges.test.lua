require('init')
require('Log')

local subtract_prohibitions = require('subtract_time_ranges')

describe('subtract_time_ranges (subtract_prohibitions)', function()
  it('subtracts no_parking times from other rules', function()
    local list = {
      'loading (09:00-20:00)',
      'no_parking (14:00-18:00)',
    }
    local result = subtract_prohibitions(list)
    assert.are.equal(#result, 2)
    assert.are.equal(result[1], 'loading (09:00-14:00,18:00-20:00)')
    assert.are.equal(result[2], 'no_parking (14:00-18:00)')
  end)

  it('leaves prohibition entries unchanged', function()
    local list = { 'no_stopping (08:00-18:00)' }
    local result = subtract_prohibitions(list)
    assert.are.equal(#result, 1)
    assert.are.equal(result[1], 'no_stopping (08:00-18:00)')
  end)

  it('leaves entries without parentheses unchanged', function()
    local list = { 'free', 'paid' }
    local result = subtract_prohibitions(list)
    assert.are.same(result, list)
  end)

  it('returns same list for nil or empty', function()
    assert.are.equal(subtract_prohibitions(nil), nil)
    assert.are.same(subtract_prohibitions({}), {})
  end)

  it('does not modify non-prohibition entries that have no time overlap', function()
    local list = {
      'loading (06:00-10:00)',
      'no_parking (14:00-18:00)',
    }
    local result = subtract_prohibitions(list)
    assert.are.equal(result[1], 'loading (06:00-10:00)')
    assert.are.equal(result[2], 'no_parking (14:00-18:00)')
  end)
end)
