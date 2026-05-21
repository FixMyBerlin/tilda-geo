describe('places minzoom', function()
  local minzoom = require('topics.places.helper.minzoom')

  it('returns 9 for town and city', function()
    assert.are.same(minzoom({ place = 'town' }), 9)
    assert.are.same(minzoom({ place = 'city' }), 9)
  end)

  it('returns 10 for village', function()
    assert.are.same(minzoom({ place = 'village' }), 10)
  end)

  it('returns 11 for other place values', function()
    assert.are.same(minzoom({ place = 'hamlet' }), 11)
  end)
end)
