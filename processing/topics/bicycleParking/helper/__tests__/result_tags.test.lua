describe('bicycleParking result_tags', function()
  local osm2pgsql = require('topics.helper.osm2pgsql')
  local result_tags = require('topics.bicycleParking.helper.result_tags')

  it('keeps osm_capacity as raw string', function()
    local cleaned_tags = result_tags({
      amenity = 'bicycle_parking',
      capacity = '60',
      ['capacity:cargo_bike'] = '05',
    })

    assert.are.equal(cleaned_tags.osm_capacity, '60')
    assert.are.equal(cleaned_tags['osm_capacity:cargo_bike'], '05')
  end)

  it('keeps non-numeric osm_capacity values unchanged', function()
    local cleaned_tags = result_tags({
      amenity = 'bicycle_parking',
      capacity = 'ca. 60',
      ['capacity:cargo_bike'] = 'unknown',
    })

    assert.are.equal(cleaned_tags.osm_capacity, 'ca. 60')
    assert.are.equal(cleaned_tags['osm_capacity:cargo_bike'], 'unknown')
  end)
end)
