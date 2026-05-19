describe('time_utils', function()
  local time_utils = require('topics.helper.time_utils')

  describe('age_in_days', function()
    it('return nil for nil input', function()
      local result = age_in_days(nil)
      assert.are.same(result, nil)
    end)

    it('return correct age in days for valid date', function()
      local today = os.time()
      local yesterday = today - 3600 * 24 * 1
      local result = age_in_days(yesterday)
      assert.are.same(result, 1)
    end)

    it('return nil for invalid date', function()
      local result = age_in_days('foo')
      assert.are.same(result, nil)
    end)
  end)

  describe('parse_date', function()
    it('should return correct timestamp for valid date', function()
      local result = parse_check_date('2023-12-01')
      assert(result == os.time({ year = 2023, month = 12, day = 1 }))
    end)

    it('should return nil for nil input', function()
      local result = parse_check_date(nil)
      assert(result == nil)
    end)

    it('should return nil for invalid date format', function()
      local result = parse_check_date('23-12-01')
      assert(result == nil)
    end)

    it('should return nil for invalid date format', function()
      local result = parse_check_date('12-01-2023')
      assert(result == nil)
    end)

    it('should return correct timestamp for valid date with day set to 0', function()
      local result = parse_check_date('2023-12-00')
      assert(result == os.time({ year = 2023, month = 12, day = 0 }))
    end)

    it('should return nil for invalid date format', function()
      local result = parse_check_date('2023-12')
      assert(result == nil)
    end)

    it('should return nil for invalid date format', function()
      local result = parse_check_date('2023')
      assert(result == nil)
    end)

    it('should return nil for invalid date format', function()
      local result = parse_check_date('foo')
      assert(result == nil)
    end)
  end)
end)
