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
      local result = THIS_OR_THAT.value_confidence_source('value', thisTable, thatTable)
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
      local result = THIS_OR_THAT.value_confidence_source('value', thisTable, thatTable)
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
      local result = THIS_OR_THAT.value_confidence_source('value', thisTable, thatTable)
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
      local result = THIS_OR_THAT.value_confidence_source('value', thisTable, thatTable)
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
      local result = THIS_OR_THAT.value_confidence_source('value', thisTable, thatTable)
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
      local result = THIS_OR_THAT.value_confidence_source('value', thisTable, thatTable)
      -- In Lua, setting table keys to nil removes them, so we get an empty table
      assert.are.same(result, {})
    end)

    -- Test case based on the selected code pattern from result_tags_parkings.lua
    -- Now the function works with any key structure, including 'surface'
    it('handles surface tags with confidence and source like in result_tags_parkings', function()
      local thisTable = {
        surface = 'asphalt',
        surface_confidence = 'high',
        surface_source = 'tag'
      }
      local thatTable = {
        surface = 'concrete',
        surface_confidence = 'medium',
        surface_source = 'parent_highway_tag'
      }
      local result = THIS_OR_THAT.value_confidence_source('surface', thisTable, thatTable)
      assert.are.same(result, thisTable)
    end)

    it('works with different key structures', function()
      local thisTable = {
        width = '5',
        width_confidence = 'high',
        width_source = 'tag'
      }
      local thatTable = {
        width = '3',
        width_confidence = 'medium',
        width_source = 'parent'
      }
      local result = THIS_OR_THAT.value_confidence_source('width', thisTable, thatTable)
      assert.are.same(result, thisTable)
    end)

    it('works with different value types', function()
      local thisTable = {
        width = 5,
        width_confidence = 'high',
        width_source = 'tag'
      }
      local thatTable = {
        width = 3,
        width_confidence = 'medium',
        width_source = 'parent'
      }
      local result = THIS_OR_THAT.value_confidence_source('width', thisTable, thatTable)
      assert.are.same(result, thisTable)
    end)

    it('handles empty thisTable', function()
      local thisTable = {}
      local thatTable = {
        surface = 'concrete',
        surface_confidence = 'medium',
        surface_source = 'parent_highway_tag'
      }
      local result = THIS_OR_THAT.value_confidence_source('surface', thisTable, thatTable)
      -- When thisTable is empty, the key doesn't exist, so it should return thatTable
      assert.are.same(result, thatTable)
    end)

    it('handles invalid check_key parameter', function()
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
      local success, error = pcall(function()
        THIS_OR_THAT.value_confidence_source(nil, thisTable, thatTable)
      end)
      assert.is_false(success)
      assert.is_string(error)
      assert.is_not_nil(string.find(error, "requires a string check_key as first parameter"))
    end)

    it('handles non-string check_key parameter', function()
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
      local success, error = pcall(function()
        THIS_OR_THAT.value_confidence_source(123, thisTable, thatTable)
      end)
      assert.is_false(success)
      assert.is_string(error)
      assert.is_not_nil(string.find(error, "requires a string check_key as first parameter"))
    end)
  end)
end)
