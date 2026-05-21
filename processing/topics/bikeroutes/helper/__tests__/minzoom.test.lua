describe('bikeroutes minzoom', function()
  local minzoom = require('topics.bikeroutes.helper.minzoom')

  it('returns 9 for bikeroutes rows', function()
    assert.are.same(minzoom({}), 9)
  end)
end)
