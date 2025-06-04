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
    assert.are.equal(type(result.category), 'table')
    assert.are.equal(result.category.id, 'bicycle_parking')
    assert.are.equal(type(result.object), 'table')
    assert.are.equal(result.object.tags.capacity, '10')
    assert.are.equal(row_tags.tags.capacity, 10)
    assert.are.equal(result.object.tags.everything, 'is_copied')
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
    assert.are.equal(result_tags.id, 'way/'..object.id)
    assert.are.equal(type(result_tags.meta.updated_at), 'string')
    assert.are.equal(result_tags.tags.osm_mapillary, object.tags.mapillary)
    assert.are.equal(result_tags.tags.not_copied, nil)
  end)

  it('parklet', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ['leisure'] = 'parklet',
      }
    }
    local result = categorize_area(object)
    assert.are.equal(result.category.id, 'parklet')

    assert.are.equal(type(result.object), 'table')
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
    assert.are.equal(result.category.id, 'road_marking_restricted_area')
    assert.are.equal(type(result.object), 'table')
    assert.are.equal(result_tags.id, 'way/'..object.id)
  end)
end)
