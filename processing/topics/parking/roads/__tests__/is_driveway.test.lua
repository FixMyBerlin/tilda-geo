describe('`is_driveway`', function()
  require('init')
  local is_driveway = require('is_driveway')
  require('Log')

  it('ignores non highway', function()
    local tags = {
      ['foo'] = 'bar',
    }
    local result = is_driveway(tags)
    assert.are.equal(result, false)
  end)

  it('ignores some highways', function()
    local tags = {
      ['highway'] = 'residential',
    }
    local result = is_driveway(tags)
    assert.are.equal(result, false)
  end)

  it('ignores some construction highways', function()
    local tags = {
      ['highway'] = 'construction',
      ['construction'] = 'residential',
    }
    local result = is_driveway(tags)
    assert.are.equal(result, false)
  end)

  it('works for highway service', function()
    local tags = {
      ['highway'] = 'service',
    }
    local result = is_driveway(tags)
    assert.are.equal(result, true)
  end)

  it('works for construction highway service', function()
    local tags = {
      ['highway'] = 'construction',
      ['construction'] = 'service',
    }
    local result = is_driveway(tags)
    assert.are.equal(result, true)
  end)

  it('accepts special access values A', function()
    local tags = {
      ['highway'] = 'footway',
      ['emergency'] = 'yes',
    }
    local result = is_driveway(tags)
    assert.are.equal(result, true)
  end)

  it('accepts special access values B', function()
    local tags = {
      ['highway'] = 'path',
      ['motor_vehicle'] = 'destination',
    }
    local result = is_driveway(tags)
    assert.are.equal(result, true)
  end)

  it('way/1338736243', function()
    local tags = {
      ['bicycle'] = 'designated',
      ['bicycle_road'] = 'yes',
      ['cycleway:both'] = 'no',
      ['foot'] = 'use_sidepath',
      ['highway'] = 'residential',
      ['oneway'] = 'yes',
      ['oneway:bicycle'] = 'no',
      ['priority_road'] = 'designated',
      ['sidewalk'] = 'separate',
      ['vehicle'] = 'destination',
      ['width'] = '9',
    }
    local result = is_driveway(tags)
    assert.are.is_false(result)
  end)
end)
