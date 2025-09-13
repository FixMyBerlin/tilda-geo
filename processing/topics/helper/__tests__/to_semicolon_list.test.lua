local to_semicolon_list = require('to_semicolon_list')

describe('to_semicolon_list', function()
  describe('basic functionality', function()
    it('should return nil for nil input', function()
      local result = to_semicolon_list(nil)
      assert.are.equal(nil, result)
    end)

    it('should return nil for empty array', function()
      local result = to_semicolon_list({})
      assert.are.equal(nil, result)
    end)

    it('should handle single value', function()
      local result = to_semicolon_list({'single'})
      assert.are.equal('single', result)
    end)

    it('should sort values alphabetically', function()
      local result = to_semicolon_list({'bbb', 'aaa', 'ccc'})
      assert.are.equal('aaa;bbb;ccc', result)
    end)

    it('should remove duplicates', function()
      local result = to_semicolon_list({'bbb', 'aaa', 'bbb', 'aaa'})
      assert.are.equal('aaa;bbb', result)
    end)

    it('should filter out nil values', function()
      local result = to_semicolon_list({'b1', nil, 'a1', nil})
      assert.are.equal('a1;b1', result)
    end)

    it('should filter out empty strings', function()
      local result = to_semicolon_list({'bbb', '', 'aaa', ''})
      assert.are.equal('aaa;bbb', result)
    end)

    it('should return nil if all values are nil or empty', function()
      local result = to_semicolon_list({nil, '', nil, ''})
      assert.are.equal(nil, result)
    end)
  end)


  describe('complex scenarios', function()
    it('should handle mixed case and sort alphabetically', function()
      local result = to_semicolon_list({'Zebra', 'apple', 'Banana'})
      assert.are.equal('Banana;Zebra;apple', result)
    end)

    it('should handle numbers and letters mixed', function()
      local result = to_semicolon_list({'3', '1', '2', 'a', 'c', 'b'})
      assert.are.equal('1;2;3;a;b;c', result)
    end)

    it('should handle parking vehicle types example', function()
      local result = to_semicolon_list({'taxi', 'bus', 'hgv'})
      assert.are.equal('bus;hgv;taxi', result)
    end)

    it('should handle array with nil, empty, and valid values', function()
      local result = to_semicolon_list({'bus', nil, 'taxi', '', 'hgv', nil})
      assert.are.equal('bus;hgv;taxi', result)
    end)
  end)
end)
