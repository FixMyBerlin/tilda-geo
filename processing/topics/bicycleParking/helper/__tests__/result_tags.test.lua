describe('bicycleParking result_tags', function()
  local osm2pgsql = require('topics.helper.osm2pgsql')
  local result_tags = require('topics.bicycleParking.helper.result_tags')

  it('has no osm_* keys', function()
    local cleaned_tags = result_tags({
      amenity = 'bicycle_parking',
      capacity = '60',
      ['capacity:cargo_bike'] = '05',
    })

    for key in pairs(cleaned_tags) do
      assert.is_nil(key:match('^osm_'), 'unexpected key ' .. key)
    end
  end)

  it('reports non-numeric capacities as replaced', function()
    local cleaned_tags, replaced_tags = result_tags({
      amenity = 'bicycle_parking',
      capacity = 'ca. 60',
      ['capacity:cargo_bike'] = 'unknown',
    })

    assert.is_nil(cleaned_tags.capacity)
    assert.are.equal(replaced_tags.capacity, 'ca. 60')
    assert.are.equal(replaced_tags['capacity:cargo_bike'], 'unknown')
  end)

  it('reports nothing for numeric capacities', function()
    local _, replaced_tags = result_tags({
      amenity = 'bicycle_parking',
      capacity = '10',
      ['capacity:cargo_bike'] = '2',
    })

    assert.is_nil(replaced_tags.capacity)
    assert.is_nil(replaced_tags['capacity:cargo_bike'])
  end)

  it('has no capacity:* keys and no kind or capacity (set per part)', function()
    local cleaned_tags = result_tags({
      amenity = 'bicycle_parking',
      capacity = '10',
      ['capacity:cargo_bike'] = '2',
    })

    assert.is_nil(cleaned_tags.kind)
    assert.is_nil(cleaned_tags.capacity)
    for key in pairs(cleaned_tags) do
      assert.is_nil(key:match('^capacity:'), 'unexpected key ' .. key)
    end
  end)

  it('reads position from <amenity>:position', function()
    local cleaned_tags = result_tags({
      amenity = 'small_electric_vehicle_parking',
      ['small_electric_vehicle_parking:position'] = 'shoulder',
    })

    assert.are.equal(cleaned_tags.position, 'shoulder')
  end)

  it('reads position from bicycle_parking:position before position', function()
    local cleaned_tags = result_tags({
      amenity = 'bicycle_parking',
      ['bicycle_parking:position'] = 'lane',
      position = 'sidewalk',
    })

    assert.are.equal(cleaned_tags.position, 'lane')
  end)

  it('keeps cargo_bike=designated as access_cargo_bike', function()
    local cleaned_tags = result_tags({
      amenity = 'bicycle_parking',
      cargo_bike = 'designated',
    })

    assert.are.equal(cleaned_tags.access_cargo_bike, 'designated')
  end)

  it('keeps the rental station type as rental_type', function()
    local cleaned_tags = result_tags({
      amenity = 'bicycle_rental',
      bicycle_rental = 'docking_station',
      network = 'nextbike',
    })

    assert.are.equal(cleaned_tags.rental_type, 'docking_station')
    assert.are.equal(cleaned_tags.network, 'nextbike')
  end)
end)
