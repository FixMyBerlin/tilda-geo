describe('`categorize_separate_parking points`', function()
  local log = require('topics.helper.log')
  local separate_parking_point_categories = require('topics.parking.separate_parkings.point.separate_parking_point_categories')
  local categorize_separate_parking = require('topics.parking.separate_parkings.helper.categorize_separate_parking')

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
