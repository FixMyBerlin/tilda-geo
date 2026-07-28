describe('TAG_HELPER.is_obstacle_parking', function()
  local TAG_HELPER = require('topics.parking.obstacles.helper.tag_helper')
  local log = require('topics.helper.log')
  it('returns true when obstacle:parking is yes', function()
    local tags = { ['obstacle:parking'] = 'yes' }
    assert.is_true(TAG_HELPER.is_obstacle_parking(tags))
  end)

  it('returns false when obstacle:parking is not yes', function()
    local tags = { ['obstacle:parking'] = 'no' }
    assert.is_false(TAG_HELPER.is_obstacle_parking(tags))
  end)

  it('returns false when obstacle:parking is missing', function()
    local tags = { foo = 'bar' }
    assert.is_false(TAG_HELPER.is_obstacle_parking(tags))
  end)
end)
