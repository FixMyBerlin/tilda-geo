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

  describe('handels category:get_capacity', function()
    it('area=<value> fails for point geometry', function()
      local object = {
        id = 1, type = 'node',
        tags = {
          ['amenity'] = 'parking',
          ['parking'] = 'lane',
        },
      }
      local result = categorize_separate_parking(object, separate_parking_point_categories)
      assert.has_error(function()
        result.category:get_capacity('node', result.object.tags, 100)
      end, "class_separate_parking_category:get_capacity does not expect area=<Number> value for point data.")
    end)
    it('handles tags.capacity', function()
      local object = {
        id = 1, type = 'node',
        tags = {
          ['amenity'] = 'parking',
          ['parking'] = 'lane',
          ['capacity'] = '12',
        },
      }
      local result = categorize_separate_parking(object, separate_parking_point_categories)
      local capacity_tags = result.category:get_capacity('node', result.object.tags, nil)
      assert.are.equal(result.category.id, 'parking_lane')
      assert.are.equal(capacity_tags.area, 12 * 14.5)
      assert.are.equal(capacity_tags.capacity, 12)
      assert.are.equal(capacity_tags.capacity_confidence, 'high')
      assert.are.equal(capacity_tags.capacity_source, 'tag')
      -- Log({capacity_tags, result, row_tags})
    end)
    it('calculates capacity from area', function()
      local object = {
        id = 1, type = 'node',
        tags = {
          ['amenity'] = 'parking',
          ['parking'] = 'lane',
        },
      }
      local result = categorize_separate_parking(object, separate_parking_point_categories)
      local capacity_tags = result.category:get_capacity('node', result.object.tags, nil)
      assert.are.equal(result.category.id, 'parking_lane')
      assert.are.equal(capacity_tags.area, 14.5)
      assert.are.equal(capacity_tags.capacity, 1)
      assert.are.equal(capacity_tags.capacity_confidence, 'low')
      assert.are.equal(capacity_tags.capacity_source, 'assumed_default')
      -- Log({capacity_tags, result, row_tags})
    end)
  end)
end)
