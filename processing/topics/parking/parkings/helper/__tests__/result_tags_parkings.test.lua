describe("`result_tags_parkings`", function()
  require('init')
  require('transform_parkings')
  require('result_tags_parkings')
  require('Log')
  require('osm2pgsql')

  it('works', function()
    local input_object = {
      tags = {
        highway = 'residential',
        mapillary = "123",
        ["parking:left"] = 'lane',
      },
      id = 1,
      type = 'way',
    }
    local results = transform_parkings(input_object)

    local left = result_tags_parkings(results.left)
    assert.are.equal(left.id, "way/1/left")
    assert.are.equal(left.tags.side, "left")
    assert.are.equal(left.tags.parking, "lane")
    assert.are.equal(left.tags.osm_mapillary, input_object.tags.mapillary)

    local right = result_tags_parkings(results.right)
    assert.are.equal(right.id, "way/1/right")
    assert.are.equal(right.tags.side, "right")
    assert.are.equal(right.tags.parking, "missing")
    assert.are.equal(right.tags.osm_mapillary, input_object.tags.mapillary)
  end)

  describe("parking tag", function()
    -- explicit value is tested above

    it('falls back to "not_expected" for dual_carriage', function()
      local input_object = {
        tags = {
          highway = 'residential',
          dual_carriageway = 'yes',
          ['parking:right'] = 'no',
        },
        id = 1,
        type = 'way',
      }
      local results = transform_parkings(input_object)

      local left = result_tags_parkings(results.left)
      assert.are.equal(left.id, "way/1/left")
      assert.are.equal(left.tags.side, "left")
      assert.are.equal(left.tags.parking, "not_expected")

      local right = result_tags_parkings(results.right)
      assert.are.equal(right.id, "way/1/right")
      assert.are.equal(right.tags.side, "right")
      assert.are.equal(right.tags.parking, "no")
    end)

    it('falls back to "missing" for is_road', function()
      local input_object = {
        tags = {
          highway = 'residential',
          ['parking:right'] = 'no',
        },
        id = 1,
        type = 'way',
      }
      local results = transform_parkings(input_object)

      local left = result_tags_parkings(results.left)
      assert.are.equal(left.id, "way/1/left")
      assert.are.equal(left.tags.side, "left")
      assert.are.equal(left.tags.parking, "missing")

      local right = result_tags_parkings(results.right)
      assert.are.equal(right.id, "way/1/right")
      assert.are.equal(right.tags.side, "right")
      assert.are.equal(right.tags.parking, "no")
    end)
  end)
end)
