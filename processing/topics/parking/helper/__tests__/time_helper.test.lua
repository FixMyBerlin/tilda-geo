require('init')
require('Log')

local time_helper = require('time_helper')

describe('time_helper', function()
  describe('expand_day_expr', function()
    it('expands single day', function()
      local result = time_helper.expand_day_expr('Su')
      assert.are.same(result, { 'Su' })
    end)

    it('expands day range Mo-Fr', function()
      local result = time_helper.expand_day_expr('Mo-Fr')
      assert.are.same(result, { 'Mo', 'Tu', 'We', 'Th', 'Fr' })
    end)

    it('expands comma-separated days and ranges', function()
      local result = time_helper.expand_day_expr('Mo,We,Fr')
      assert.are.same(result, { 'Mo', 'We', 'Fr' })
    end)

    it('expands Mo-We,Su style', function()
      local result = time_helper.expand_day_expr('Mo-We,Su')
      assert.are.same(result, { 'Mo', 'Tu', 'We', 'Su' })
    end)

    it('returns nil for invalid expression', function()
      assert.are.equal(time_helper.expand_day_expr('Xy'), nil)
    end)
  end)

  describe('parse_times', function()
    it('parses single time range', function()
      local result = time_helper.parse_times('08:00-18:00')
      assert.are.equal(#result, 1)
      assert.are.equal(result[1].from, 8 * 60)
      assert.are.equal(result[1].to, 18 * 60)
    end)

    it('parses comma-separated ranges', function()
      local result = time_helper.parse_times('08:00-12:00,14:00-18:00')
      assert.are.equal(#result, 2)
      assert.are.equal(result[1].from, 8 * 60)
      assert.are.equal(result[2].from, 14 * 60)
    end)

    it('sorts ranges by from', function()
      local result = time_helper.parse_times('14:00-18:00,08:00-12:00')
      assert.are.equal(result[1].from, 8 * 60)
      assert.are.equal(result[2].from, 14 * 60)
    end)

    it('returns nil for invalid format', function()
      assert.are.equal(time_helper.parse_times('invalid'), nil)
    end)
  end)

  describe('invert_ranges', function()
    it('inverts single range to before and after', function()
      local ranges = { { from = 480, to = 720 } } -- 08:00-12:00
      local result = time_helper.invert_ranges(ranges)
      assert.are.equal(#result, 2)
      assert.are.equal(result[1].from, 0)
      assert.are.equal(result[1].to, 480)
      assert.are.equal(result[2].from, 720)
      assert.are.equal(result[2].to, 1440)
    end)
  end)

  describe('ranges_to_string', function()
    it('formats ranges as HH:MM-HH:MM', function()
      local ranges = { { from = 480, to = 720 } }
      local result = time_helper.ranges_to_string(ranges)
      assert.are.equal(result, '08:00-12:00')
    end)

    it('returns nil for empty ranges', function()
      assert.are.equal(time_helper.ranges_to_string({}), nil)
    end)
  end)

  describe('merge_ranges', function()
    it('merges overlapping ranges', function()
      local ranges = {
        { from = 0, to = 600 },
        { from = 480, to = 720 },
      }
      local result = time_helper.merge_ranges(ranges)
      assert.are.equal(#result, 1)
      assert.are.equal(result[1].from, 0)
      assert.are.equal(result[1].to, 720)
    end)

    it('returns same list for single or zero ranges', function()
      local one = { { from = 0, to = 1440 } }
      assert.are.same(time_helper.merge_ranges(one), one)
    end)
  end)

  describe('subtract_ranges', function()
    it('subtracts forbidden from base', function()
      local base = { { from = 0, to = 1440 } }
      local forbidden = { { from = 480, to = 720 } }
      local result = time_helper.subtract_ranges(base, forbidden)
      assert.are.equal(#result, 2)
      assert.are.equal(result[1].from, 0)
      assert.are.equal(result[1].to, 480)
      assert.are.equal(result[2].from, 720)
      assert.are.equal(result[2].to, 1440)
    end)

    it('returns empty when base is empty', function()
      assert.are.same(time_helper.subtract_ranges({}, { { from = 0, to = 1440 } }), {})
    end)

    it('returns base when forbidden is empty', function()
      local base = { { from = 0, to = 1440 } }
      assert.are.same(time_helper.subtract_ranges(base, {}), base)
    end)
  end)

  describe('build_day_map', function()
    it('builds map from day and time condition', function()
      local result = time_helper.build_day_map('Mo-Fr 08:00-18:00')
      assert.truthy(result)
      assert.truthy(result.Mo)
      assert.are.equal(#result.Mo, 1)
      assert.are.equal(result.Mo[1].from, 8 * 60)
      assert.are.equal(result.Mo[1].to, 18 * 60)
    end)

    it('handles multiple blocks with semicolon', function()
      local result = time_helper.build_day_map('Mo-Fr 08:00-18:00; Sa 09:00-14:00')
      assert.truthy(result)
      assert.truthy(result.Sa)
      assert.are.equal(result.Sa[1].from, 9 * 60)
    end)

    it('returns nil for unsupported expression', function()
      assert.are.equal(time_helper.build_day_map('Mar-Oct 08:00-18:00'), nil)
    end)
  end)

  describe('compact_day_map', function()
    it('compacts same time on consecutive days to range', function()
      local day_time_map = {
        Mo = '08:00-18:00',
        Tu = '08:00-18:00',
        We = '08:00-18:00',
        Th = '08:00-18:00',
        Fr = '08:00-18:00',
      }
      local result = time_helper.compact_day_map(day_time_map)
      assert.are.equal(result, 'Mo-Fr 08:00-18:00')
    end)

    it('keeps different times as separate blocks', function()
      local day_time_map = {
        Mo = '08:00-18:00',
        Sa = '09:00-14:00',
      }
      local result = time_helper.compact_day_map(day_time_map)
      assert.are.equal(result, 'Mo 08:00-18:00; Sa 09:00-14:00')
    end)
  end)
end)
