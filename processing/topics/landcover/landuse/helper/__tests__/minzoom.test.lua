describe('landuse minzoom', function()
  local MINZOOM = require('topics.landcover.landuse.helper.minzoom')

  it('excludes tiny plots like way/275491187 and way/275491189', function()
    assert.is_true(MINZOOM.is_excluded(3097))
    assert.is_true(MINZOOM.is_excluded(1584))
    assert.is_false(MINZOOM.is_excluded(5000))
  end)

  it('returns 9 for large areas', function()
    assert.are.same(MINZOOM.minzoom({ _computed_area = 600000 }), 9)
    assert.are.same(MINZOOM.minzoom({ _computed_area = 500000 }), 9)
  end)

  it('returns 10 for medium areas', function()
    assert.are.same(MINZOOM.minzoom({ _computed_area = 80000 }), 10)
    assert.are.same(MINZOOM.minzoom({ _computed_area = 50000 }), 10)
  end)

  it('returns 12 for very small included areas', function()
    assert.are.same(MINZOOM.minzoom({ _computed_area = 8000 }), 12)
    assert.are.same(MINZOOM.minzoom({ _computed_area = 5000 }), 12)
  end)
end)
