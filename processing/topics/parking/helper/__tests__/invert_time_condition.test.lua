require('init')
require('Log')

local invert_time_condition = require('invert_time_condition')

describe('invert_time_condition', function()
  it('inverts fee-free times to paid times for weekdays (exact output)', function()
    -- "no fee" Mo-Fr 00:00-09:00,22:00-24:00 => "paid" Mo-Fr 09:00-22:00
    local result = invert_time_condition('Mo-Fr 00:00-09:00,22:00-24:00')
    assert.are.equal(result, 'Mo-Fr 09:00-22:00')
  end)

  it('inverts full-day free to empty (no paid period)', function()
    -- Su = whole day free => no paid period => nil
    local result = invert_time_condition('Su')
    assert.are.equal(result, nil)
  end)

  it('inverts time-only block (applies to all days Mo-Su, output omits day prefix)', function()
    -- Time-only: all weekdays get inverted range; compact_day_map outputs only time when day_expr == "Mo-Su"
    local result = invert_time_condition('00:00-09:00')
    assert.are.equal(result, '09:00-24:00')
  end)

  it('returns nil for nil or non-string input', function()
    assert.are.equal(invert_time_condition(nil), nil)
    assert.are.equal(invert_time_condition(123), nil)
  end)

  it('returns nil for unsupported expressions (e.g. month)', function()
    local result = invert_time_condition('Mar-Oct 08:00-18:00')
    assert.are.equal(result, nil)
  end)
end)
