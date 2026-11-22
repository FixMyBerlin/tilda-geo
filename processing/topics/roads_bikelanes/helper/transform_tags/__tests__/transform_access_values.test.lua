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
end)
