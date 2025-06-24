describe('`has_parking`', function()
  require('init')
  local has_parking = require('has_parking')
  require('Log')

  it('ignores non highway', function()
    local tags = {
      ['foo'] = 'bar',
    }
    local result = has_parking(tags)
    assert.are.is_false(result)
  end)

  it('is_road is always parking', function()
    local tags = {
      ['highway'] = 'residential',
    }
    local result = has_parking(tags)
    assert.are.is_true(result)
  end)

  it('is_driveway is true when "parking:" given', function()
    local tags = {
      ['highway'] = 'service',
      ['parking:left'] = 'lane',
    }
    local result = has_parking(tags)
    assert.are.is_true(result)
  end)

  -- RECHECK: Right now, we consider 'yes' a parking value.
  -- it('is_driveway is false with unclear parking value', function()
  --   local tags = {
  --     ['highway'] = 'service',
  --     ['parking:left'] = 'yes',
  --   }
  --   local result = has_parking(tags)
  --   assert.are.is_false(result)
  -- end)

  it('is_driveway is false without "parking:"', function()
    local tags = {
      ['highway'] = 'service',
    }
    local result = has_parking(tags)
    assert.are.is_false(result)
  end)
end)
