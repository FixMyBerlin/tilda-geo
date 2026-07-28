describe('`categorize_separate_parking areas`', function()
  local osm2pgsql = require('topics.helper.osm2pgsql')
  local log = require('topics.helper.log')
  local separate_parking_area_categories = require('topics.parking.separate_parkings.area.separate_parking_area_categories')
  local categorize_separate_parking = require('topics.parking.separate_parkings.helper.categorize_separate_parking')
  local result_tags = require('topics.parking.separate_parkings.helper.result_tags')

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
    local row_tags = result_tags(result.category, result.object, area)
    assert.are.equal('table', type(result.category))
    assert.are.equal('parking_lane', result.category.id)
    assert.are.equal('table', type(result.object))
    assert.are.equal('10', result.object.tags.capacity)
    assert.are.equal(10, row_tags.tags.capacity)
    assert.are.equal('is_copied', result.object.tags.everything)
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
    local result_tags = result_tags(result.category, result.object, area)
    assert.are.equal('way/'..object.id, result_tags.id)
    assert.are.equal(result_tags.tags.mapillary, object.tags.mapillary)
    assert.are.equal(result_tags.tags.not_copied, nil)
  end)

  it('parking=surface + location=median does not match On-Street (off-street only, #3076)', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ['amenity'] = 'parking',
        ['parking'] = 'surface',
        ['location'] = 'median',
      },
    }
    local result = categorize_separate_parking(object, separate_parking_area_categories)
    assert.are.equal(result.category, nil)
    assert.are.equal(result.object, nil)
  end)

  it('parking=street_side + location=median stays On-Street (#3076)', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ['amenity'] = 'parking',
        ['parking'] = 'street_side',
        ['location'] = 'median',
      },
    }
    local result = categorize_separate_parking(object, separate_parking_area_categories)
    assert.are.equal('parking_street_side', result.category.id)
    assert.are.equal(object, result.object)
  end)
end)
