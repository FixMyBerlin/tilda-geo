describe('bicycleParking bicycle_rental', function()
  require('topics.helper.osm2pgsql')
  local BICYCLE_RENTAL = require('topics.bicycleParking.helper.bicycle_rental')

  it('matches bicycle_rental on amenity, tourism and leisure', function()
    assert.is_true(BICYCLE_RENTAL.is_bicycle_rental({ amenity = 'bicycle_rental' }))
    assert.is_true(BICYCLE_RENTAL.is_bicycle_rental({ tourism = 'bicycle_rental' }))
    assert.is_true(BICYCLE_RENTAL.is_bicycle_rental({ leisure = 'bicycle_rental' }))
    assert.is_false(BICYCLE_RENTAL.is_bicycle_rental({ amenity = 'bicycle_parking' }))
  end)

  it('marks rows as bicycle_rental and keeps station details', function()
    local cleaned_tags = BICYCLE_RENTAL.result_tags({
      amenity = 'bicycle_rental',
      bicycle_rental = 'docking_station',
      name = 'Hauptbahnhof',
      operator = 'nextbike',
      network = 'MVG Rad',
      capacity = '12',
    })

    assert.are.equal(cleaned_tags.category, 'bicycle_rental')
    assert.are.equal(cleaned_tags.bicycle_rental, 'docking_station')
    assert.are.equal(cleaned_tags.name, 'Hauptbahnhof')
    assert.are.equal(cleaned_tags.operator, 'nextbike')
    assert.are.equal(cleaned_tags.network, 'MVG Rad')
    assert.are.equal(cleaned_tags.capacity, 12)
    assert.are.equal(cleaned_tags.osm_capacity, '12')
  end)

  it('drops a non-numeric capacity but keeps the raw value', function()
    local cleaned_tags = BICYCLE_RENTAL.result_tags({
      amenity = 'bicycle_rental',
      capacity = 'ca. 10',
    })

    assert.is_nil(cleaned_tags.capacity)
    assert.are.equal(cleaned_tags.osm_capacity, 'ca. 10')
  end)
end)
