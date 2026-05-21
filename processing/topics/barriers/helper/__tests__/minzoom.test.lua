describe('barriers minzoom', function()
  local minzoom = require('topics.barriers.helper.minzoom')

  it('returns 9 for barrier rows', function()
    assert.are.same(minzoom({}), 9)
  end)
end)
