describe('`result_tags_roads`', function()
  require('init')
  require('result_tags_roads')
  require('Log')
  require('osm2pgsql')

  it('works', function()
    local input_object = {
      tags = {
        highway = 'service',
        serivce = 'alley',
        mapillary = '123',
      },
      id = 1,
      type = 'way',
    }
    local result = result_tags_roads(input_object)
    assert.are.equal('way/'..input_object.id, result.id)
    assert.are.equal('number', type(result.meta.updated_at))
    assert.are.equal(input_object.tags.highway, result.tags.highway)
    assert.are.equal(input_object.tags.mapillary, result.tags.osm_mapillary)
  end)

  it('width > offset', function()
    local input_object = {
      tags = {
        highway = 'service',
        serivce = 'alley',
        width = '80',
      },
      id = 1,
      type = 'way',
    }
    local result = result_tags_roads(input_object)
    assert.are.equal('way/'..input_object.id, result.id)
    assert.are.equal('number', type(result.meta.updated_at))
    assert.are.equal(80, result.tags.width)
    assert.are.equal(40.0, result.tags.offset_left)
    assert.are.equal(40.0, result.tags.offset_right)
  end)
end)
