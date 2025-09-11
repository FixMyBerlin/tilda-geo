describe('`categorize_separate_parking points`', function()
  require('init')
  require('Log')
  local separate_parking_point_categories = require('separate_parking_point_categories')
  local categorize_separate_parking = require('categorize_separate_parking')

  it('works', function()
    local tags = {
      ['amenity'] = 'parking',
      ['parking'] = 'lane',
    }
    local result = categorize_separate_parking({ tags = tags }, separate_parking_point_categories)
    assert.are.equal(type(result), 'table')
    assert.are.equal(result.category.id, 'parking_lane')
  end)
end)
