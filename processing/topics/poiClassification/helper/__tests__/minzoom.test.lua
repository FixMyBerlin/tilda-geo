describe('poiClassification minzoom', function()
  local minzoom = require('topics.poiClassification.helper.minzoom')

  it('returns 7 for formal education entries', function()
    assert.are.same(minzoom({ formalEducation = 'school', category = 'Bildung' }), 7)
  end)

  it('returns 7 for categorized pois', function()
    assert.are.same(minzoom({ category = 'Freizeit' }), 7)
  end)

  it('returns 13 for pois without category or formal education', function()
    assert.are.same(minzoom({}), 13)
  end)
end)
