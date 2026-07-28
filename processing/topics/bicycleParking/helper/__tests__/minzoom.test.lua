describe('bicycleParking minzoom', function()
  local minzoom = require('topics.bicycleParking.helper.minzoom')

  it('returns 9 for bicycle parking rows', function()
    assert.are.same(minzoom({}), 9)
  end)
end)
