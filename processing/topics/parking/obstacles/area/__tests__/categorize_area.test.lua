describe('`categorize_area`', function()
  require('init')
  require('categorize_area')
  require('Log')
  require('osm2pgsql')
  local result_tags_obstacles = require('result_tags_obstacles')

  it('no category matches', function()
    local object = {
      id = 1, type = 'way',
      tags = { ['amenity'] = 'bicycle_parking', }
    }
    local result = categorize_area(object)
    assert.are.equal(result.category, nil)
    assert.are.equal(result.object, nil)
  end)

  it('matches bicycle parkings', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ['amenity'] = 'bicycle_parking',
        ['position'] = 'lane',
        ['capacity'] = '10',
        ['everything'] = 'is_copied',
      }
    }
    local result = categorize_area(object)
    local row_tags = result_tags_obstacles(result)
    assert.are.equal('table', type(result.category))
    assert.are.equal('bicycle_parking', result.category.id)
    assert.are.equal('table', type(result.object))
    assert.are.equal('10', result.object.tags.capacity)
    assert.are.equal(10, row_tags.tags.capacity)
    assert.are.equal('is_copied', result.object.tags.everything)
  end)

  it('works with result_tags', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ['amenity'] = 'bicycle_parking',
        ['position'] = 'lane',
        ['capacity'] = '10',
        ['not_copied'] = 'not_in_further_tags',
        ['mapillary'] = '123',
      },
    }
    local result = categorize_area(object)
    local result_tags = result_tags_obstacles(result)
    assert.are.equal('way/'..object.id, result_tags.id)
    assert.are.equal(object.tags.mapillary, result_tags.tags.osm_mapillary)
    assert.are.equal(nil, result_tags.tags.not_copied)
  end)

  it('parklet', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ['leisure'] = 'parklet',
      }
    }
    local result = categorize_area(object)
    assert.are.equal('parklet', result.category.id)

    assert.are.equal('table', type(result.object))
  end)

  it('road_marking_restricted_area', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ['area:highway'] = 'prohibited',
      },
    }
    local result = categorize_area(object)
    local result_tags = result_tags_obstacles(result)
    assert.are.equal('road_marking_restricted_area', result.category.id)
    assert.are.equal('table', type(result.object))
    assert.are.equal('way/'..object.id, result_tags.id)
  end)
end)
