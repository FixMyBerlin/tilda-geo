describe('`result_tags_crossings`', function()
  require('init')
  local categorize_and_transform_crossing_points = require('categorize_and_transform_crossing_points')
  require('osm2pgsql')
  require('Log')
  local result_tags_crossings = require('result_tags_crossings')

  it('works with tags, tags_cc', function()
    local input_object = {
      tags = {
        crossing = 'zebra',
        mapillary = '123',
        ref = '007',
      },
      id = 1,
      type = 'node'
    }
    local results = categorize_and_transform_crossing_points(input_object)
    assert.are.equal(nil, results.self.category)

    local left_result = result_tags_crossings(results.left)
    assert.are.equal('node/'..input_object.id..'/'..results.left.object.tags.side, left_result.id)
    assert.are.equal('crossing_zebra', left_result.tags.category)
    assert.are.equal('left', left_result.tags.side)
    assert.are.equal(input_object.tags.mapillary, left_result.tags.osm_mapillary)
    assert.are.equal(input_object.tags.crossing_ref, left_result.tags.osm_ref)

    local right_result = result_tags_crossings(results.right)
    assert.are.equal('node/'..input_object.id..'/'..results.right.object.tags.side, right_result.id)
    assert.are.equal(results.right.category.perform_snap, right_result.tags.perform_snap)
    assert.are.equal('crossing_zebra', right_result.tags.category)
    assert.are.equal('right', right_result.tags.side)
    assert.are.equal(input_object.tags.mapillary, right_result.tags.osm_mapillary)
  end)
end)
