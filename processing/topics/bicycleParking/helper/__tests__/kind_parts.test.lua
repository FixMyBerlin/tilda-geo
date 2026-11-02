describe('bicycleParking kind_parts', function()
  local kind_parts = require('topics.bicycleParking.helper.kind_parts')

  it('returns one bicycle_parking part with the capacity', function()
    assert.are.same({ { kind = 'bicycle_parking', capacity = 10 } }, kind_parts({ amenity = 'bicycle_parking', capacity = '10' }))
  end)

  it('returns one bicycle_parking part without capacity when none is given', function()
    assert.are.same({ { kind = 'bicycle_parking', capacity = nil } }, kind_parts({ amenity = 'bicycle_parking' }))
  end)

  it('treats capacity 0 as no capacity', function()
    assert.are.same({ { kind = 'bicycle_parking', capacity = nil } }, kind_parts({ amenity = 'bicycle_parking', capacity = '0' }))
  end)

  it('keeps cargo_bike=yes and no as bicycle_parking', function()
    assert.are.same({ { kind = 'bicycle_parking', capacity = 10 } }, kind_parts({ amenity = 'bicycle_parking', capacity = '10', cargo_bike = 'yes' }))
    assert.are.same({ { kind = 'bicycle_parking', capacity = 10 } }, kind_parts({ amenity = 'bicycle_parking', capacity = '10', cargo_bike = 'no' }))
  end)

  it('returns one cargo_bike_parking part with the total when cargo_bike=designated and no cargo spaces', function()
    assert.are.same({ { kind = 'cargo_bike_parking', capacity = 10 } }, kind_parts({ amenity = 'bicycle_parking', cargo_bike = 'designated', capacity = '10' }))
    assert.are.same({ { kind = 'cargo_bike_parking', capacity = nil } }, kind_parts({ amenity = 'bicycle_parking', cargo_bike = 'designated' }))
    assert.are.same({ { kind = 'cargo_bike_parking', capacity = nil } }, kind_parts({ amenity = 'bicycle_parking', cargo_bike = 'designated', capacity = '0' }))
  end)

  it('returns one cargo_bike_parking part with the cargo spaces when only cargo spaces are given', function()
    assert.are.same({ { kind = 'cargo_bike_parking', capacity = 2 } }, kind_parts({ amenity = 'bicycle_parking', ['capacity:cargo_bike'] = '2' }))
    assert.are.same({ { kind = 'cargo_bike_parking', capacity = 2 } }, kind_parts({ amenity = 'bicycle_parking', capacity = '2', ['capacity:cargo_bike'] = '2' }))
    assert.are.same({ { kind = 'cargo_bike_parking', capacity = 2 } }, kind_parts({ amenity = 'bicycle_parking', capacity = '0', ['capacity:cargo_bike'] = '2' }))
  end)

  it('takes the cargo spaces out of capacity and returns bicycle_parking first', function()
    assert.are.same({
      { kind = 'bicycle_parking', capacity = 8 },
      { kind = 'cargo_bike_parking', capacity = 2 },
    }, kind_parts({ amenity = 'bicycle_parking', capacity = '10', ['capacity:cargo_bike'] = '2' }))
  end)

  it('keeps designated with cargo spaces as a split, not as all cargo', function()
    assert.are.same({
      { kind = 'bicycle_parking', capacity = 8 },
      { kind = 'cargo_bike_parking', capacity = 2 },
    }, kind_parts({ amenity = 'bicycle_parking', capacity = '10', cargo_bike = 'designated', ['capacity:cargo_bike'] = '2' }))
  end)

  it('uses the cargo spaces as the capacity when they are more than capacity', function()
    assert.are.same({ { kind = 'cargo_bike_parking', capacity = 5 } }, kind_parts({ amenity = 'bicycle_parking', capacity = '2', ['capacity:cargo_bike'] = '5' }))
  end)

  it('keeps the normal spaces without a count when capacity is not a number', function()
    assert.are.same({
      { kind = 'bicycle_parking', capacity = nil },
      { kind = 'cargo_bike_parking', capacity = 2 },
    }, kind_parts({ amenity = 'bicycle_parking', capacity = 'ca. 60', ['capacity:cargo_bike'] = '2' }))
  end)

  it('ignores cargo spaces that are zero or not a number', function()
    assert.are.same({ { kind = 'bicycle_parking', capacity = 10 } }, kind_parts({ amenity = 'bicycle_parking', capacity = '10', ['capacity:cargo_bike'] = '0' }))
    assert.are.same({ { kind = 'bicycle_parking', capacity = 10 } }, kind_parts({ amenity = 'bicycle_parking', capacity = '10', ['capacity:cargo_bike'] = 'unknown' }))
    assert.are.same({ { kind = 'bicycle_parking', capacity = nil } }, kind_parts({ amenity = 'bicycle_parking', ['capacity:cargo_bike'] = 'unknown' }))
  end)

  it('returns one small_electric_vehicle_parking part for e-scooter and kick-scooter parking', function()
    assert.are.same({ { kind = 'small_electric_vehicle_parking', capacity = 4 } }, kind_parts({ amenity = 'small_electric_vehicle_parking', capacity = '4' }))
    assert.are.same({ { kind = 'small_electric_vehicle_parking', capacity = nil } }, kind_parts({ amenity = 'kick-scooter_parking' }))
  end)

  it('does not split other kinds by cargo capacity', function()
    assert.are.same({ { kind = 'small_electric_vehicle_parking', capacity = 4 } }, kind_parts({ amenity = 'small_electric_vehicle_parking', capacity = '4', ['capacity:cargo_bike'] = '2' }))
  end)

  it('returns one mobility_hub part', function()
    assert.are.same({ { kind = 'mobility_hub', capacity = nil } }, kind_parts({ amenity = 'mobility_hub' }))
  end)

  it('returns one bicycle_rental part for rental types other than shop and virtual', function()
    assert.are.same({ { kind = 'bicycle_rental', capacity = nil } }, kind_parts({ amenity = 'bicycle_rental' }))
    assert.are.same({ { kind = 'bicycle_rental', capacity = nil } }, kind_parts({ amenity = 'bicycle_rental', bicycle_rental = 'docking_station' }))
    assert.are.same({ { kind = 'bicycle_rental', capacity = nil } }, kind_parts({ amenity = 'bicycle_rental', bicycle_rental = 'dropoff_point' }))
  end)

  it('returns no parts for bicycle_rental shops and virtual rentals', function()
    assert.are.same({}, kind_parts({ amenity = 'bicycle_rental', bicycle_rental = 'shop' }))
    assert.are.same({}, kind_parts({ amenity = 'bicycle_rental', bicycle_rental = 'virtual' }))
  end)

  it('returns no parts for other or missing amenities', function()
    assert.are.same({}, kind_parts({ amenity = 'bench' }))
    assert.are.same({}, kind_parts({ amenity = 'motorcycle_parking' }))
    assert.are.same({}, kind_parts({ highway = 'cycleway' }))
    assert.are.same({}, kind_parts({}))
  end)
end)
