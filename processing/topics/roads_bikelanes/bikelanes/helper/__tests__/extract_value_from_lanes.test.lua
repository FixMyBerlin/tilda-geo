describe('extract_value_from_lanes helper', function()
  require('init')
  local extract_value_from_lanes = require('extract_value_from_lanes')
  describe('_parse_lanes_value', function()
    it('should parse simple lanes value', function()
      local result = extract_value_from_lanes._parse_lanes_value('1|2|3')
      assert.are.equal(#result, 3)
      assert.are.equal(result[1], '1')
      assert.are.equal(result[2], '2')
      assert.are.equal(result[3], '3')
    end)

    it('should handle empty values in lanes schema', function()
      local result = extract_value_from_lanes._parse_lanes_value('1||3')
      assert.are.equal(#result, 3)
      assert.are.equal(result[1], '1')
      assert.are.equal(result[2], '')
      assert.are.equal(result[3], '3')
    end)

    it('should handle single value', function()
      local result = extract_value_from_lanes._parse_lanes_value('single')
      assert.are.equal(#result, 1)
      assert.are.equal(result[1], 'single')
    end)
  end)

  describe('_findLaneIndex', function()
    it('should find lane index in cycleway:lanes', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|lane|no'
      }
      local result = extract_value_from_lanes._find_lane_index(tags)
      assert.are.equal(result, 3)
    end)

    it('should find designated index in bicycle:lanes', function()
      local tags = {
        ['bicycle:lanes'] = 'no|designated|no|no'
      }
      local result = extract_value_from_lanes._find_lane_index(tags)
      assert.are.equal(result, 2)
    end)

    it('should return nil when no lane or designated found', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|no|no'
      }
      local result = extract_value_from_lanes._find_lane_index(tags)
      assert.are.equal(result, nil)
    end)

    it('should prioritize cycleway:lanes over bicycle:lanes', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|lane|no',
        ['bicycle:lanes'] = 'no|designated|no|no'
      }
      local result = extract_value_from_lanes._find_lane_index(tags)
      assert.are.equal(result, 3) -- Should find lane at position 3, not designated at position 2
    end)
  end)

  describe('extract_value_from_lanes', function()
    it('should extract value from cycleway:lanes position', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|lane|no',
        ['width:lanes'] = '3.5|3.5|3.75|3.75'
      }
      local result = extract_value_from_lanes.extract_value_from_lanes('width:lanes', tags)
      assert.are.equal(result, '3.75')
    end)

    it('should extract value from bicycle:lanes position', function()
      local tags = {
        ['bicycle:lanes'] = 'no|designated|no|no',
        ['width:lanes'] = '3.5|3.75|3.5|3.5'
      }
      local result = extract_value_from_lanes.extract_value_from_lanes('width:lanes', tags)
      assert.are.equal(result, '3.75')
    end)

    it('should return nil for empty values', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|lane|no',
        ['width:lanes'] = '3.5|3.5||3.75'
      }
      local result = extract_value_from_lanes.extract_value_from_lanes('width:lanes', tags)
      assert.are.equal(result, nil)
    end)

    it('should return nil when lanes_tag is missing', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|lane|no'
      }
      local result = extract_value_from_lanes.extract_value_from_lanes('width:lanes', tags)
      assert.are.equal(result, nil)
    end)

    it('should return nil when no lane or designated found', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|no|no',
        ['width:lanes'] = '3.5|3.5|3.75|3.75'
      }
      local result = extract_value_from_lanes.extract_value_from_lanes('width:lanes', tags)
      assert.are.equal(result, nil)
    end)

    it('should work with different lanes tags', function()
      local tags = {
        ['cycleway:lanes'] = 'no|no|lane|no',
        ['surface:lanes'] = 'asphalt|asphalt|concrete|asphalt',
        ['width:lanes'] = '3.5|3.5|3.75|3.75'
      }

      local surface = extract_value_from_lanes.extract_value_from_lanes('surface:lanes', tags)
      local width = extract_value_from_lanes.extract_value_from_lanes('width:lanes', tags)

      assert.are.equal(surface, 'concrete')
      assert.are.equal(width, '3.75')
    end)
  end)

  describe('extractLastValueFromLanes', function()
    it('should extract the last value from lanes schema', function()
      local result = extract_value_from_lanes.extract_last_value_from_lanes('1|2|3')
      assert.are.equal(result, '3')
    end)

    it('should handle single value', function()
      local result = extract_value_from_lanes.extract_last_value_from_lanes('single')
      assert.are.equal(result, 'single')
    end)

    it('should handle empty values in lanes schema', function()
      local result = extract_value_from_lanes.extract_last_value_from_lanes('1||3')
      assert.are.equal(result, '3')
    end)

    it('should handle empty string', function()
      local result = extract_value_from_lanes.extract_last_value_from_lanes('')
      assert.are.equal(result, '')
    end)

    it('should handle nil input', function()
      local result = extract_value_from_lanes.extract_last_value_from_lanes(nil)
      assert.are.equal(result, nil)
    end)

    it('should handle complex lanes schema', function()
      local result = extract_value_from_lanes.extract_last_value_from_lanes('asphalt|concrete|gravel|dirt')
      assert.are.equal(result, 'dirt')
    end)
  end)
end)
