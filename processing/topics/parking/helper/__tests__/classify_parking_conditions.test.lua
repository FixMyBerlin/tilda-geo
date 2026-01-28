require('init')
require('Log')

describe('`classify_parking_conditions`', function()
  local classify_parking_conditions = require('classify_parking_conditions')

  describe('parse_conditional_value', function()
    it('parses valid conditional values', function()
      local result = classify_parking_conditions.parse_conditional_value('loading_only @ (Mo-Fr 08:00-18:00)')
      assert.are.equal(result.value, 'loading_only')
      assert.are.equal(result.condition, 'Mo-Fr 08:00-18:00')
    end)

    it('parses restriction conditional values', function()
      local result = classify_parking_conditions.parse_conditional_value('no_parking @ (Mo-Fr 06:00-22:00)')
      assert.are.equal(result.value, 'no_parking')
      assert.are.equal(result.condition, 'Mo-Fr 06:00-22:00')
    end)

    it('parses fee conditional values', function()
      local result = classify_parking_conditions.parse_conditional_value('yes @ (Mo-Fr 09:00-18:00)')
      assert.are.equal(result.value, 'yes')
      assert.are.equal(result.condition, 'Mo-Fr 09:00-18:00')
    end)

    it('handles whitespace variations', function()
      local result = classify_parking_conditions.parse_conditional_value('  loading_only  @  (  Mo-Fr 08:00-18:00  )  ')
      assert.are.equal(result.value, 'loading_only')
      assert.are.equal(result.condition, 'Mo-Fr 08:00-18:00')
    end)

    it('returns nil for invalid format', function()
      local result = classify_parking_conditions.parse_conditional_value('invalid_format')
      assert.are.equal(result, nil)
    end)

    it('returns nil for nil input', function()
      local result = classify_parking_conditions.parse_conditional_value(nil)
      assert.are.equal(result, nil)
    end)

    it('returns nil for empty string', function()
      local result = classify_parking_conditions.parse_conditional_value('')
      assert.are.equal(result, nil)
    end)
  end)

  describe('classify_parking_conditions (Python-based logic)', function()
    it('creates paid condition_category for fee yes with zone', function()
      local tags = {
        fee = 'yes',
        zone = 'residential'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'paid')
      assert.are.equal(result.condition_vehicles, nil)
    end)

    it('creates residents condition_category for private access with zone', function()
      local tags = {
        access = 'private',
        zone = 'residential'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'residents')
      assert.are.equal(result.condition_vehicles, nil)
    end)

    it('creates paid condition_category for fee yes without zone', function()
      local tags = {
        fee = 'yes',
        access = 'yes',
        zone = 'no'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'paid')
      assert.are.equal(result.condition_vehicles, nil)
    end)

    it('creates free condition_category for fee no without restrictions', function()
      local tags = {
        fee = 'no',
        access = 'yes',
        zone = 'no'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'free')
      assert.are.equal(result.condition_vehicles, nil)
    end)

    it('creates loading condition_category for loading_only restriction', function()
      local tags = {
        restriction = 'loading_only'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'loading')
      assert.are.equal(result.condition_vehicles, nil)
    end)

    it('creates time_limited condition_category for maxstay', function()
      local tags = {
        maxstay = '2 hours'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'time_limited')
      assert.are.equal(result.condition_vehicles, nil)
    end)

    it('creates condition_vehicles for taxi yes', function()
      local tags = {
        taxi = 'yes'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'assumed_free')
      assert.are.equal(result.condition_vehicles, 'taxi')
    end)

    it('creates condition_vehicles for taxi no', function()
      local tags = {
        taxi = 'no'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'assumed_free')
      assert.are.equal(result.condition_vehicles, 'taxi')
    end)

    it('combines multiple vehicle designations with semicolon', function()
      local tags = {
        taxi = 'yes',
        bus = 'yes',
        hgv = 'yes'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'assumed_free')
      assert.are.equal(result.condition_vehicles, 'bus;hgv;taxi')
    end)

    it('combines multiple vehicle exclusions with semicolon', function()
      local tags = {
        taxi = 'no',
        bus = 'no',
        motorcar = 'no'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'assumed_free')
      assert.are.equal(result.condition_vehicles, 'bus;motorcar;taxi')
    end)

    it('handles conditional vehicle restrictions', function()
      local tags = {
        ['taxi:conditional'] = 'yes @ (Mo-Fr 09:00-18:00)',
        ['bus:conditional'] = 'no @ (Mo-Fr 09:00-18:00)'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'assumed_free')
      assert.are.equal(result.condition_vehicles, 'bus;taxi')
    end)

    it('handles restriction vehicle exceptions', function()
      local tags = {
        ['restriction:taxi'] = 'none'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'taxi')
      assert.are.equal(result.condition_vehicles, 'taxi')
    end)

    it('handles complex scenario with multiple conditions', function()
      local tags = {
        fee = 'yes',
        zone = 'residential',
        ['taxi:conditional'] = 'yes @ (Mo-Fr 09:00-18:00)',
        ['bus:conditional'] = 'no @ (Mo-Fr 09:00-18:00)',
        restriction = 'loading_only'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'paid;loading')
      assert.are.equal(result.condition_vehicles, 'bus;taxi')
    end)

    it('ignores invalid conditional values', function()
      local tags = {
        ['restriction:conditional'] = 'invalid_format',
        fee = 'yes',
        zone = 'residential'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'paid') -- from fee and zone
      assert.are.equal(result.condition_vehicles, nil)
    end)

    it('handles no_parking restriction', function()
      local tags = {
        restriction = 'no_parking'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'no_parking')
      assert.are.equal(result.condition_vehicles, nil)
    end)

    it('handles disabled_private condition', function()
      local tags = {
        access = 'no',
        disabled = 'private'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'disabled_private')
      assert.are.equal(result.condition_vehicles, nil)
    end)

    it('handles charging condition', function()
      local tags = {
        restriction = 'charging_only'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'charging')
      assert.are.equal(result.condition_vehicles, nil)
    end)

    it('handles conditional time information in parentheses', function()
      local tags = {
        ['restriction:conditional'] = 'loading_only @ (Mo-Sa 11:00-21:00)'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'loading (Mo-Sa 11:00-21:00)')
      assert.are.equal(result.condition_vehicles, nil)
    end)

    it('handles multiple conditions with time information', function()
      local tags = {
        fee = 'yes',
        ['fee:conditional'] = 'yes @ (Mo-Fr 08:00-18:00)',
        ['restriction:conditional'] = 'loading_only @ (Mo-Sa 11:00-21:00)'
      }

      local result = classify_parking_conditions.classify_parking_conditions(tags, 'assumed_free')

      assert.are.equal(result.condition_category, 'paid (Mo-Fr 08:00-18:00);loading (Mo-Sa 11:00-21:00)')
      assert.are.equal(result.condition_vehicles, nil)
    end)
  end)
end)
