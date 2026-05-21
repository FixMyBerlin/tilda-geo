describe('poiClassification minzoom', function()
  local minzoom = require('topics.poiClassification.helper.minzoom')

  it('returns 11 for formal education entries', function()
    assert.are.same(minzoom({ formalEducation = 'school' }), 11)
  end)

  it('returns 13 for other poi categories', function()
    assert.are.same(minzoom({ category = 'Freizeit' }), 13)
  end)
end)
