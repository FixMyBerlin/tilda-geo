describe("`result_tags_crossings`", function()
  require('init')
  local categorize_and_transform_crossing_points = require("categorize_and_transform_crossing_points")
  require("osm2pgsql")
  require("Log")
  local result_tags_crossings = require("result_tags_crossings")

  it('works with tags, tags_cc', function()
    local input_object = {
      tags = {
        crossing = 'zebra',
        mapillary = "123",
        ref = "007",
      },
      id = 1,
      type = 'node'
    }
    local results = categorize_and_transform_crossing_points(input_object)
    assert.are.equal(results.self.category, nil)

    local left_result = result_tags_crossings(results.left)
    assert.are.equal(left_result.id, "node/"..input_object.id.."/"..results.left.object.tags.side)
    assert.are.equal(type(left_result.meta.update_at), "string")
    assert.are.equal(left_result.tags.category, "crossing_zebra")
    assert.are.equal(left_result.tags.side, "left")
    assert.are.equal(left_result.tags.osm_mapillary, input_object.tags.mapillary)
    assert.are.equal(left_result.tags.osm_ref, input_object.tags.crossing_ref)

    local right_result = result_tags_crossings(results.right)
    assert.are.equal(right_result.id, "node/"..input_object.id.."/"..results.right.object.tags.side)
    assert.are.equal(right_result.tags.perform_snap, results.right.category.perform_snap)
    assert.are.equal(right_result.tags.category, "crossing_zebra")
    assert.are.equal(right_result.tags.side, "right")
    assert.are.equal(right_result.tags.osm_mapillary, input_object.tags.mapillary)
  end)
end)
