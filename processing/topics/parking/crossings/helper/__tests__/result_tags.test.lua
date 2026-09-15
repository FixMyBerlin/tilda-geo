describe('`result_tags`', function()
  local categorize_and_transform_crossing_points = require('topics.parking.crossings.points.categorize_and_transform_crossing_points')
  local osm2pgsql = require('topics.helper.osm2pgsql')
  local log = require('topics.helper.log')
  local result_tags = require('topics.parking.crossings.helper.result_tags')

  it('works with tags, tags_cc', function()
    local input_object = {
      tags = {
        crossing = 'zebra',
        mapillary = '123',
        ref = '007',
      },
      id = 1,
      type = 'node',
      -- Fields osm2pgsql attaches to the OSM object; used by `metadata()` to build `meta`.
      user = 'test_user',
      timestamp = 1700000000,
      changeset = 42,
    }
    local results = categorize_and_transform_crossing_points(input_object)
    assert.are.equal(nil, results.self.category)

    local left_result = result_tags(results.left)
    assert.are.equal('node/'..input_object.id..'/'..results.left.object.tags.side, left_result.id)
    assert.are.equal('crossing_zebra', left_result.tags.category)
    assert.are.equal('left', left_result.tags.side)
    assert.are.equal(input_object.tags.mapillary, left_result.tags.osm_mapillary)
    assert.are.equal(input_object.tags.crossing_ref, left_result.tags.osm_ref)
    -- `metadata()` must read the OSM object (`result.object`), not `result` itself.
    assert.are.equal(left_result.meta.updated_by, 'test_user')
    assert.are.equal(left_result.meta.updated_at, 1700000000)
    assert.are.equal(left_result.meta.changeset_id, 42)

    local right_result = result_tags(results.right)
    assert.are.equal('node/'..input_object.id..'/'..results.right.object.tags.side, right_result.id)
    assert.are.equal(results.right.category.perform_snap, right_result.tags.perform_snap)
    assert.are.equal('crossing_zebra', right_result.tags.category)
    assert.are.equal('right', right_result.tags.side)
    assert.are.equal(input_object.tags.mapillary, right_result.tags.osm_mapillary)
    assert.are.equal(right_result.meta.updated_by, 'test_user')
  end)
end)
