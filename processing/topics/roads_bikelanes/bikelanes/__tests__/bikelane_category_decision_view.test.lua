describe('bikelane_category decision view', function()
  require('init')
  local bikelane_categories = require('bikelane_categories')
  local SANITIZE_VALUES = require('sanitize_values')
  local BikelaneCategory = bikelane_categories.bikelane_category

  local function make_test_category(condition)
    return BikelaneCategory.new({
      id = 'testDecisionView',
      desc = '',
      infrastructureExists = false,
      implicitOneWay = false,
      implicitOneWayConfidence = 'not_applicable',
      copySurfaceSmoothnessFromParent = false,
      condition = condition,
    })
  end

  it('treats direct DISALLOWED_VALUE fields as missing', function()
    local category = make_test_category(function(tags)
      return tags.traffic_mode_right == nil
    end)

    local result = category({
      traffic_mode_right = SANITIZE_VALUES.disallowed,
    })

    assert.is_true(result)
  end)

  it('resolves sided raw tags through sanitizer for decision keys', function()
    local category = make_test_category(function(tags)
      return tags.traffic_mode_right == 'motor_vehicle'
    end)

    local result = category({
      ['traffic_mode:right'] = 'motorized',
    })

    assert.is_true(result)
  end)

  it('keeps resolved sided keys nil when sanitizer disallows value', function()
    local category = make_test_category(function(tags)
      return tags.separation_left == nil
    end)

    local result = category({
      ['separation:left'] = 'totally_unknown',
      separation_left = 'should_not_override_sanitizer_result',
    })

    assert.is_true(result)
  end)

  it('falls back to direct key reads when no sided sanitizer exists', function()
    local category = make_test_category(function(tags)
      return tags.foo_left == 'raw_value'
    end)

    local result = category({
      foo_left = 'raw_value',
    })

    assert.is_true(result)
  end)

  it('hides DISALLOWED_VALUE entries during pairs iteration', function()
    local category = make_test_category(function(tags)
      local key_count = 0
      for _ in pairs(tags) do
        key_count = key_count + 1
      end
      return key_count == 1
    end)

    local result = category({
      highway = 'cycleway',
      traffic_mode_right = SANITIZE_VALUES.disallowed,
    })

    assert.is_true(result)
  end)

  it('forwards writes from decision view to original tags', function()
    local category = make_test_category(function(tags)
      tags.lifecycle = 'construction'
      return true
    end)

    local source_tags = { highway = 'residential' }
    local result = category(source_tags)

    assert.is_true(result)
    assert.are.equal(source_tags.lifecycle, 'construction')
  end)
end)
