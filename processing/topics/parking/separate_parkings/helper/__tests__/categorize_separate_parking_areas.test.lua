describe('`categorize_separate_parking areas`', function()
  require('init')
  require('osm2pgsql')
  require('Log')
  local separate_parking_area_categories = require('separate_parking_area_categories')
  local categorize_separate_parking = require('categorize_separate_parking')
  local result_tags_separate_parking = require('result_tags_separate_parking')

  it('no category matches', function()
    local object = {
      id = 1, type = 'way',
      tags = { ['amenity'] = 'bicycle_parking', }
    }
    local result = categorize_separate_parking(object, separate_parking_area_categories)
    assert.are.equal(result.category, nil)
    assert.are.equal(result.object, nil)
  end)

  it('works with matches', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ['amenity'] = 'parking',
        ['parking'] = 'lane',
        ['everything'] = 'is_copied',
        ['capacity'] = '10',
      }
    }
    local result = categorize_separate_parking(object, separate_parking_area_categories)
    local area = 100
    local row_tags = result_tags_separate_parking(result, area)
    assert.are.equal(type(result.category), 'table')
    assert.are.equal(result.category.id, 'parking_lane')
    assert.are.equal(type(result.object), 'table')
    assert.are.equal(result.object.tags.capacity, '10')
    assert.are.equal(row_tags.tags.capacity, 10)
    assert.are.equal(result.object.tags.everything, 'is_copied')
  end)

  it('works with result_tags', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ['amenity'] = 'parking',
        ['parking'] = 'lane',
        ['not_copied'] = 'not_in_further_tags',
        ['mapillary'] = '123',
      },
    }
    local result = categorize_separate_parking(object, separate_parking_area_categories)
    local area = 100
    local result_tags = result_tags_separate_parking(result, area)
    assert.are.equal(result_tags.id, 'way/'..object.id)
    assert.are.equal(type(result_tags.meta.updated_at), 'string')
    assert.are.equal(result_tags.tags.osm_mapillary, object.tags.mapillary)
    assert.are.equal(result_tags.tags.not_copied, nil)
  end)

  describe('handels category:get_capacity', function()
    it('area=nil fails for area geometry', function()
      local object = {
        id = 1, type = 'way',
        tags = {
          ['amenity'] = 'parking',
          ['parking'] = 'lane',
        },
      }
      local result = categorize_separate_parking(object, separate_parking_area_categories)
      assert.has_error(function()
        result.category:get_capacity('way', result.object.tags, nil)
      end, "class_separate_parking_category:get_capacity requires an area=<Number> value for area data.")
    end)
    it('handles tags.capacity', function()
      local object = {
        id = 1, type = 'way',
        tags = {
          ['amenity'] = 'parking',
          ['parking'] = 'lane',
          ['capacity'] = '12',
        },
      }
      local result = categorize_separate_parking(object, separate_parking_area_categories)
      local capacity_tags = result.category:get_capacity('way', result.object.tags, 100)
      assert.are.equal(result.category.id, 'parking_lane')
      assert.are.equal(capacity_tags.area, 100)
      assert.are.equal(capacity_tags.capacity, 12)
      assert.are.equal(capacity_tags.capacity_confidence, 'high')
      assert.are.equal(capacity_tags.capacity_source, 'tag')
      -- Log({capacity_tags, result, row_tags})
    end)
    it('calculates capacity from area', function()
      local object = {
        id = 1, type = 'way',
        tags = {
          ['amenity'] = 'parking',
          ['parking'] = 'lane',
        },
      }
      local result = categorize_separate_parking(object, separate_parking_area_categories)
      local capacity_tags = result.category:get_capacity('way', result.object.tags, 100)
      assert.are.equal(result.category.id, 'parking_lane')
      assert.are.equal(capacity_tags.area, 100)
      assert.are.equal(capacity_tags.capacity, 7)
      assert.are.equal(capacity_tags.capacity_confidence, 'medium')
      assert.are.equal(capacity_tags.capacity_source, 'area')
      -- Log({capacity_tags, result, row_tags})
    end)
  end)
end)
