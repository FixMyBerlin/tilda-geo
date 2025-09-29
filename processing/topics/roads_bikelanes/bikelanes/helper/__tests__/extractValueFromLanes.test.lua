require('init')
local extractValueFromLanes = require('extractValueFromLanes')

describe('extractValueFromLanes helper', function()
  describe('_parseLanesValue', function()
    it('should parse simple lanes value', function()
      local result = extractValueFromLanes._parseLanesValue('1|2|3')
      assert.are.equal(#result, 3)
      assert.are.equal(result[1], '1')
      assert.are.equal(result[2], '2')
      assert.are.equal(result[3], '3')
    end)

    it('should handle empty values in lanes schema', function()
      local result = extractValueFromLanes._parseLanesValue('1||3')
      assert.are.equal(#result, 3)
      assert.are.equal(result[1], '1')
      assert.are.equal(result[2], '')
      assert.are.equal(result[3], '3')
    end)

    it('should handle single value', function()
      local result = extractValueFromLanes._parseLanesValue('single')
      assert.are.equal(#result, 1)
      assert.are.equal(result[1], 'single')
    end)
  end)

  describe('_findLaneIndex', function()
    it('should find lane index in cycleway:lanes', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|lane|no'
      }
      local result = extractValueFromLanes._findLaneIndex(tags)
      assert.are.equal(result, 3)
    end)

    it('should find designated index in bicycle:lanes', function()
      local tags = {
        ['bicycle:lanes'] = 'no|designated|no|no'
      }
      local result = extractValueFromLanes._findLaneIndex(tags)
      assert.are.equal(result, 2)
    end)

    it('should return nil when no lane or designated found', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|no|no'
      }
      local result = extractValueFromLanes._findLaneIndex(tags)
      assert.are.equal(result, nil)
    end)

    it('should prioritize cycleway:lanes over bicycle:lanes', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|lane|no',
        ['bicycle:lanes'] = 'no|designated|no|no'
      }
      local result = extractValueFromLanes._findLaneIndex(tags)
      assert.are.equal(result, 3) -- Should find lane at position 3, not designated at position 2
    end)
  end)

  describe('extractValueFromLanes', function()
    it('should extract value from cycleway:lanes position', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|lane|no',
        ['width:lanes'] = '3.5|3.5|3.75|3.75'
      }
      local result = extractValueFromLanes.extractValueFromLanes('width:lanes', tags)
      assert.are.equal(result, '3.75')
    end)

    it('should extract value from bicycle:lanes position', function()
      local tags = {
        ['bicycle:lanes'] = 'no|designated|no|no',
        ['width:lanes'] = '3.5|3.75|3.5|3.5'
      }
      local result = extractValueFromLanes.extractValueFromLanes('width:lanes', tags)
      assert.are.equal(result, '3.75')
    end)

    it('should return nil for empty values', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|lane|no',
        ['width:lanes'] = '3.5|3.5||3.75'
      }
      local result = extractValueFromLanes.extractValueFromLanes('width:lanes', tags)
      assert.are.equal(result, nil)
    end)

    it('should return nil when lanes_tag is missing', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|lane|no'
      }
      local result = extractValueFromLanes.extractValueFromLanes('width:lanes', tags)
      assert.are.equal(result, nil)
    end)

    it('should return nil when no lane or designated found', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|no|no',
        ['width:lanes'] = '3.5|3.5|3.75|3.75'
      }
      local result = extractValueFromLanes.extractValueFromLanes('width:lanes', tags)
      assert.are.equal(result, nil)
    end)

    it('should work with different lanes tags', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|lane|no',
        ['surface:lanes'] = 'asphalt|asphalt|concrete|asphalt',
        ['width:lanes'] = '3.5|3.5|3.75|3.75'
      }

      local surface = extractValueFromLanes.extractValueFromLanes('surface:lanes', tags)
      local width = extractValueFromLanes.extractValueFromLanes('width:lanes', tags)

      assert.are.equal(surface, 'concrete')
      assert.are.equal(width, '3.75')
    end)
  end)
end)
