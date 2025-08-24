require('init')
local THIS_OR_THAT = require('this_or_that')
local SANITIZE_VALUES = require('sanitize_values')

describe('THIS_OR_THAT', function()
  describe('value', function()
    it('returns thisValue when it is valid', function()
      local result = THIS_OR_THAT.value('valid_value', 'fallback_value')
      assert.are.equal(result, 'valid_value')
    end)

    it('returns thatValue when thisValue is nil', function()
      local result = THIS_OR_THAT.value(nil, 'fallback_value')
      assert.are.equal(result, 'fallback_value')
    end)

    it('returns thatValue when thisValue is disallowed', function()
      local result = THIS_OR_THAT.value(SANITIZE_VALUES.disallowed, 'fallback_value')
      assert.are.equal(result, 'fallback_value')
    end)

    it('returns nil when both values are nil', function()
      local result = THIS_OR_THAT.value(nil, nil)
      assert.are.equal(result, nil)
    end)

    it('returns nil when both values are disallowed', function()
      local result = THIS_OR_THAT.value(SANITIZE_VALUES.disallowed, SANITIZE_VALUES.disallowed)
      assert.are.equal(result, nil)
    end)

    it('returns nil when thisValue is disallowed and thatValue is nil', function()
      local result = THIS_OR_THAT.value(SANITIZE_VALUES.disallowed, nil)
      assert.are.equal(result, nil)
    end)

    it('returns thatValue when thisValue is nil and thatValue is valid', function()
      local result = THIS_OR_THAT.value(nil, 'valid_fallback')
      assert.are.equal(result, 'valid_fallback')
    end)
  end)

  describe('value_confidence_source', function()
    it('returns thisTable when thisTable.value is valid', function()
      local thisTable = {
        value = 'valid_value',
        confidence = 'high',
        source = 'tag'
      }
      local thatTable = {
        value = 'fallback_value',
        confidence = 'medium',
        source = 'parent'
      }
      local result = THIS_OR_THAT.value_confidence_source(thisTable, thatTable)
      assert.are.same(result, thisTable)
    end)

    it('returns thatTable when thisTable.value is nil and thatTable.value is valid', function()
      local thisTable = {
        value = nil,
        confidence = 'high',
        source = 'tag'
      }
      local thatTable = {
        value = 'fallback_value',
        confidence = 'medium',
        source = 'parent'
      }
      local result = THIS_OR_THAT.value_confidence_source(thisTable, thatTable)
      assert.are.same(result, thatTable)
    end)

    it('returns thatTable when thisTable.value is disallowed and thatTable.value is valid', function()
      local thisTable = {
        value = SANITIZE_VALUES.disallowed,
        confidence = 'high',
        source = 'tag'
      }
      local thatTable = {
        value = 'fallback_value',
        confidence = 'medium',
        source = 'parent'
      }
      local result = THIS_OR_THAT.value_confidence_source(thisTable, thatTable)
      assert.are.same(result, thatTable)
    end)

    it('returns nilTable when both values are nil', function()
      local thisTable = {
        value = nil,
        confidence = 'high',
        source = 'tag'
      }
      local thatTable = {
        value = nil,
        confidence = 'medium',
        source = 'parent'
      }
      local result = THIS_OR_THAT.value_confidence_source(thisTable, thatTable)
      -- In Lua, setting table keys to nil removes them, so we get an empty table
      assert.are.same(result, {})
    end)

    it('returns nilTable when both values are disallowed', function()
      local thisTable = {
        value = SANITIZE_VALUES.disallowed,
        confidence = 'high',
        source = 'tag'
      }
      local thatTable = {
        value = SANITIZE_VALUES.disallowed,
        confidence = 'medium',
        source = 'parent'
      }
      local result = THIS_OR_THAT.value_confidence_source(thisTable, thatTable)
      -- In Lua, setting table keys to nil removes them, so we get an empty table
      assert.are.same(result, {})
    end)

    it('returns nilTable when thisTable.value is disallowed and thatTable.value is nil', function()
      local thisTable = {
        value = SANITIZE_VALUES.disallowed,
        confidence = 'high',
        source = 'tag'
      }
      local thatTable = {
        value = nil,
        confidence = 'medium',
        source = 'parent'
      }
      local result = THIS_OR_THAT.value_confidence_source(thisTable, thatTable)
      -- In Lua, setting table keys to nil removes them, so we get an empty table
      assert.are.same(result, {})
    end)


  end)
end)
