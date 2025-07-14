describe("`result_tags_roads`", function()
  require('init')
  require("result_tags_roads")
  require("Log")
  require('osm2pgsql')

  it('works', function()
    local input_object = {
      tags = {
        highway = 'service',
        serivce = "alley",
        mapillary = "123",
      },
      id = 1,
      type = 'way',
    }
    local result = result_tags_roads(input_object)
    assert.are.equal(result.id, "way/"..input_object.id)
    assert.are.equal(type(result.meta.updated_at), 'number')
    assert.are.equal(result.tags.highway, input_object.tags.highway)
    assert.are.equal(result.tags.osm_mapillary, input_object.tags.mapillary)
  end)

  it('width > offset', function()
    local input_object = {
      tags = {
        highway = 'service',
        serivce = "alley",
        width = "80",
      },
      id = 1,
      type = 'way',
    }
    local result = result_tags_roads(input_object)
    assert.are.equal(result.id, "way/"..input_object.id)
    assert.are.equal(type(result.meta.updated_at), 'number')
    assert.are.equal(result.tags.width, 80)
    assert.are.equal(result.tags.offset_left, 40.0)
    assert.are.equal(result.tags.offset_right, 40.0)
  end)
end)
