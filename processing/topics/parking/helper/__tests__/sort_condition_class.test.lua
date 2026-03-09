require('init')
require('Log')

local sort_condition_class = require('sort_condition_class')

describe('sort_condition_class', function()
  it('sorts entries with time conditions by start time', function()
    local list = {
      'mixed (Mo-Fr 18:00-20:00)',
      'no_parking (08:00-14:00)',
      'no_stopping (06:00-08:00,14:00-18:00)',
    }
    local result = sort_condition_class(list)
    assert.are.equal(result[1], 'no_stopping (06:00-08:00,14:00-18:00)')
    assert.are.equal(result[2], 'no_parking (08:00-14:00)')
    assert.are.equal(result[3], 'mixed (Mo-Fr 18:00-20:00)')
  end)

  it('keeps entries without parentheses (no time) first', function()
    local list = {
      'time_limited (08:00-18:00)',
      'charging',
    }
    local result = sort_condition_class(list)
    assert.are.equal(result[1], 'charging')
    assert.are.equal(result[2], 'time_limited (08:00-18:00)')
  end)

  it('returns same list for nil or empty', function()
    assert.are.equal(sort_condition_class(nil), nil)
    local empty = {}
    assert.are.same(sort_condition_class(empty), empty)
  end)

  it('sorts in place and returns the same table', function()
    local list = { 'no_parking (08:00-14:00)', 'free' }
    local result = sort_condition_class(list)
    assert.are.equal(list, result)
    assert.are.equal(result[1], 'free')
    assert.are.equal(result[2], 'no_parking (08:00-14:00)')
  end)
end)
