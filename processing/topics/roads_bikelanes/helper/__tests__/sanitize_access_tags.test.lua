local sanitize_access_tags = require('topics.roads_bikelanes.helper.sanitize_access_tags')

local resolve = sanitize_access_tags.resolve
local normalize = sanitize_access_tags.normalize
local sanitize = sanitize_access_tags.sanitize
local sanitized_access = sanitize_access_tags.sanitized_access

describe('sanitize_access_tags.resolve (OSM access fallback chain)', function()
  it('returns the explicit tag when present', function()
    assert.are.equal('no', resolve({ bicycle = 'no' }, 'bicycle'))
    assert.are.equal('destination', resolve({ motor_vehicle = 'destination' }, 'motor_vehicle'))
  end)

  it('falls back along the chain (vehicle, then access)', function()
    assert.are.equal('no', resolve({ vehicle = 'no' }, 'bicycle'))
    assert.are.equal('private', resolve({ access = 'private' }, 'bicycle'))
    assert.are.equal('no', resolve({ vehicle = 'no' }, 'motor_vehicle'))
    assert.are.equal('no', resolve({ access = 'no' }, 'motor_vehicle'))
  end)

  it('lets the explicit tag win over a fallback', function()
    assert.are.equal('yes', resolve({ bicycle = 'yes', vehicle = 'no' }, 'bicycle'))
  end)

  it('resolves the longer chains (bus -> psv -> motor_vehicle -> vehicle -> access)', function()
    assert.are.equal('no', resolve({ motor_vehicle = 'no' }, 'bus'))
    assert.are.equal('no', resolve({ access = 'no' }, 'bus'))
  end)

  it('returns nil when nothing matches or the mode has no chain', function()
    assert.is_nil(resolve({}, 'bicycle'))
    assert.is_nil(resolve({ highway = 'residential' }, 'bicycle'))
    assert.is_nil(resolve({}, 'tank'))
  end)
end)

describe('sanitize_access_tags.normalize (agricultural_or_forestry)', function()
  it('collapses the four agricultural/forestry spellings', function()
    assert.are.equal('agricultural_or_forestry', normalize('agricultural'))
    assert.are.equal('agricultural_or_forestry', normalize('forestry'))
    assert.are.equal('agricultural_or_forestry', normalize('agricultural;forestry'))
    assert.are.equal('agricultural_or_forestry', normalize('forestry;agricultural'))
  end)

  it('passes other values (and nil) through unchanged', function()
    assert.are.equal('destination', normalize('destination'))
    assert.are.equal('no', normalize('no'))
    assert.is_nil(normalize(nil))
  end)
end)

describe('sanitize_access_tags.sanitize (allowlist per mode)', function()
  it('keeps allowlisted motor_vehicle values', function()
    assert.are.equal('destination', sanitize('destination', 'motor_vehicle'))
    assert.are.equal('agricultural_or_forestry', sanitize('agricultural_or_forestry', 'motor_vehicle'))
  end)

  it('keeps allowlisted bicycle values', function()
    assert.are.equal('designated', sanitize('designated', 'bicycle'))
    assert.are.equal('use_sidepath', sanitize('use_sidepath', 'bicycle'))
    assert.are.equal('dismount', sanitize('dismount', 'bicycle'))
  end)

  it('drops values not allowlisted for the mode', function()
    assert.is_nil(sanitize('foobar', 'motor_vehicle'))
    assert.is_nil(sanitize('designated', 'motor_vehicle')) -- bicycle value, not a motor one
    assert.is_nil(sanitize(nil, 'bicycle'))
  end)
end)

describe('sanitize_access_tags.sanitized_access (resolve -> normalize -> sanitize)', function()
  it('normalises agricultural/forestry and keeps it', function()
    assert.are.equal('agricultural_or_forestry', sanitized_access({ motor_vehicle = 'agricultural' }, 'motor_vehicle'))
  end)

  it('resolves the chain then keeps allowlisted values', function()
    assert.are.equal('no', sanitized_access({ vehicle = 'no' }, 'motor_vehicle'))
    assert.are.equal('designated', sanitized_access({ bicycle = 'designated' }, 'bicycle'))
    assert.are.equal('use_sidepath', sanitized_access({ bicycle = 'use_sidepath' }, 'bicycle'))
    assert.are.equal('dismount', sanitized_access({ bicycle = 'dismount' }, 'bicycle'))
  end)

  it('drops non-allowlisted or absent values', function()
    assert.is_nil(sanitized_access({ motor_vehicle = 'foobar' }, 'motor_vehicle'))
    assert.is_nil(sanitized_access({}, 'motor_vehicle'))
  end)
end)
