describe('`result_tags_obstacles`', function()
  require('init')
  local categorize_obstacle_points = require('categorize_obstacle_points')
  require('osm2pgsql')
  require('Log')
  local result_tags_obstacles = require('result_tags_obstacles')

  it('works', function()
    local input_object = {
      tags = {
        barrier = 'bollard',
        ['obstacle:parking'] = 'yes',
        mapillary = '123'
      },
      id = 1,
      type = 'node'
    }
    local result = categorize_obstacle_points(input_object)
    local result_tags = result_tags_obstacles(result)

    assert.are.equal(result_tags.id, 'node/'..input_object.id)
    assert.are.equal(result_tags.tags.category, 'bollard')
    assert.are.equal(result_tags.tags.osm_mapillary, input_object.tags.mapillary)
  end)

  it('check tags, tags_cc', function()
    local input_object = {
      tags = {
        ['obstacle:parking'] = 'yes',
        natural = 'tree_stump',
        mapillary = '123',
        ref = '007',
      },
      id = 1,
      type = 'node'
    }
    local result = categorize_obstacle_points(input_object)
    local result_tags = result_tags_obstacles(result)
    assert.are.equal(result_tags.tags.osm_mapillary, '123')
    assert.are.equal(result_tags.tags.osm_ref, '007')
    assert.are.equal(result_tags.tags.natural, 'tree_stump')
  end)


  it('handels buffer for two wheel parking', function()
    local input_object = {
      tags = {
        ['amenity'] = 'bicycle_parking',
        ['position'] = 'lane',
        ['capacity'] = '10',
        ['capacity:cargo'] = '5',
      },
      id = 1,
      type = 'node'
    }
    local result = categorize_obstacle_points(input_object)
    local result_tags = result_tags_obstacles(result)
    assert.are.equal(result_tags.tags.capacity, 5)
    assert.are.equal(result_tags.tags['capacity:cargo'], 5)
    assert.are.equal(result_tags.tags.buffer_radius, 10 / 2 * 1.6)
  end)
end)
