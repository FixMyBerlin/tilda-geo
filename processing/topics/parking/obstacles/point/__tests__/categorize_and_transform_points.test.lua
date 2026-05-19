describe('`categorize_obstacle_points`', function()
  local categorize_obstacle_points = require('topics.parking.obstacles.point.categorize_obstacle_points')
  local log = require('topics.helper.log')

  it('works', function()
    local tags = {
      ['natural'] = 'tree',
      ['obstacle:parking'] = 'yes',
    }
    local result = categorize_obstacle_points({ tags = tags })
    assert.are.equal(type(result), 'table')
    assert.are.equal(result.category.id, 'tree')
  end)

end)
