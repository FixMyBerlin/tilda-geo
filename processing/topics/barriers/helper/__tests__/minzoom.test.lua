describe('barriers minzoom', function()
  local minzoom = require('topics.barriers.helper.minzoom')

  it('returns 7 for barrier rows', function()
    assert.are.same(minzoom({}), 7)
  end)
end)
