describe('transform_access_values', function()
  local transform_access_values = require('topics.roads_bikelanes.helper.transform_tags.transform_access_values')

  it('reads unknown like no tag', function()
    local tags = { highway = 'track', access = 'unknown', bicycle = 'unknown' }
    transform_access_values(tags)
    assert.are.same({ highway = 'track' }, tags)
  end)

  it('reads military as no and residents as private on every access key', function()
    local tags = { highway = 'track', access = 'military', vehicle = 'residents', motor_vehicle = 'military' }
    transform_access_values(tags)
    assert.are.same({ highway = 'track', access = 'no', vehicle = 'private', motor_vehicle = 'no' }, tags)
  end)

  it('leaves other keys and values alone', function()
    local tags = { highway = 'service', access = 'destination', ['access:conditional'] = 'military', note = 'unknown' }
    transform_access_values(tags)
    assert.are.same({ highway = 'service', access = 'destination', ['access:conditional'] = 'military', note = 'unknown' }, tags)
  end)

  it('reads optional_sidepath like no tag and official as designated', function()
    local tags = { highway = 'secondary', bicycle = 'optional_sidepath', foot = 'official' }
    transform_access_values(tags)
    assert.are.same({ highway = 'secondary', foot = 'designated' }, tags)
  end)

  it('reads emergency, psv and bus as no, employees and restricted as private', function()
    local tags = { highway = 'service', access = 'emergency', vehicle = 'psv', motor_vehicle = 'bus', foot = 'employees', bicycle = 'restricted' }
    transform_access_values(tags)
    assert.are.same({ highway = 'service', access = 'no', vehicle = 'no', motor_vehicle = 'no', foot = 'private', bicycle = 'private' }, tags)
  end)

  it('reads a list as its most open value', function()
    local cases = {
      ['agricultural;destination'] = 'destination',
      ['destination;agricultural;forestry'] = 'destination',
      ['private;delivery'] = 'delivery',
      ['agricultural;private'] = 'agricultural',
      ['psv;emergency'] = 'no',
      ['unknown;yes'] = 'yes',
      [' delivery ; destination '] = 'destination',
      ['forestry;agricultural'] = 'agricultural;forestry',
      ['foo;bar'] = 'foo;bar',
    }
    for value, expected in pairs(cases) do
      local tags = { highway = 'track', vehicle = value }
      transform_access_values(tags)
      assert.are.same(expected, tags.vehicle, value)
    end
  end)
end)
