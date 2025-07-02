describe("`categorize_and_transform_crossing_points`", function()
  require('init')
  local categorize_and_transform_crossing_points = require("categorize_and_transform_crossing_points")
  require("Log")

  it('no category matches', function()
    local tags = {
      ["natural"] = 'tree',
      ["obstacle:parking"] = 'yes',
    }
    local result = categorize_and_transform_crossing_points({ tags = tags })
    assert.are.equal(result.self.category, nil)
    assert.are.equal(result.left.category, nil)
    assert.are.equal(result.right.category, nil)
  end)

  it('category matches and source is "left"', function()
    local tags = {
      ["crossing:kerb_extension"] = 'left',
      ["any"] = 'tag',
    }
    local result = categorize_and_transform_crossing_points({ tags = tags })
    assert.are.equal(result.self.category, nil)

    assert.are.equal(type(result.left), "table")
    assert.are.equal(result.left.category.id, 'crossing_kerb_extension')
    assert.are.equal(result.left.object.tags.side, 'left')
    assert.are.equal(result.left.object.tags.any, 'tag')

    assert.are.equal(result.right.category, nil)
  end)

  it('category matches and source is "both"', function()
    local tags = {
      ["crossing:kerb_extension"] = 'both',
    }
    local result = categorize_and_transform_crossing_points({ tags = tags })
    assert.are.equal(result.self.category, nil)

    assert.are.equal(type(result.left), "table")
    assert.are.equal(result.left.category.id, 'crossing_kerb_extension')
    assert.are.equal(result.left.object.tags.side, 'left')
    assert.are.equal(result.left.object.tags["crossing:kerb_extension"], 'left')

    assert.are.equal(type(result.right), "table")
    assert.are.equal(result.right.category.id, 'crossing_kerb_extension')
    assert.are.equal(result.right.object.tags.side, 'right')
    assert.are.equal(result.right.object.tags["crossing:kerb_extension"], 'right')
  end)

  it('category only matches for left|right|both values"', function()
    local tags = {
      ["crossing:kerb_extension"] = 'unknown',
    }
    local result = categorize_and_transform_crossing_points({ tags = tags })
    assert.are.equal(result.self.category, nil)
    assert.are.equal(result.left.category, nil)
    assert.are.equal(result.right.category, nil)
  end)

  it('two categories match one per side; if the buffer is the same, the first in the class wins', function()
    local tags = {
      ["crossing:kerb_extension"] = 'left',
      ["crossing:buffer_marking"] = 'both',
    }
    local result = categorize_and_transform_crossing_points({ tags = tags })
    assert.are.equal(result.self.category, nil)

    assert.are.equal(type(result.left), "table")
    assert.are.equal(result.left.category.id, 'crossing_buffer_marking')
    assert.are.equal(result.left.category:get_buffer_radius(tags), 3)
    assert.are.equal(result.left.object.tags.side, 'left')
    assert.are.equal(result.left.object.tags["crossing:kerb_extension"], 'left')
    assert.are.equal(result.left.object.tags["crossing:buffer_marking"], 'left')

    assert.are.equal(type(result.right), "table")
    assert.are.equal(result.right.category.id, 'crossing_buffer_marking')
    assert.are.equal(result.right.category:get_buffer_radius(tags), 3)
    assert.are.equal(result.right.object.tags.side, 'right')
    assert.are.equal(result.right.object.tags["crossing:kerb_extension"], 'left')
    assert.are.equal(result.right.object.tags["crossing:buffer_marking"], 'right')
  end)

  it('two categories match and the largest buffer wins', function()
    local tags = {
      ["crossing"] = 'marked',
      ["crossing:markings"] = 'zebra',
    }
    local result = categorize_and_transform_crossing_points({ tags = tags })
    assert.are.equal(result.self.category, nil)

    assert.are.equal(type(result.left), "table")
    assert.are.equal(result.left.category.id, 'crossing_zebra')
    assert.are.equal(result.left.category:get_buffer_radius(tags), 4.5)
    assert.are.equal(result.left.object.tags.side, 'left')

    assert.are.equal(type(result.right), "table")
    assert.are.equal(result.right.category.id, 'crossing_zebra')
    assert.are.equal(result.right.category:get_buffer_radius(tags), 4.5)
    assert.are.equal(result.right.object.tags.side, 'right')
  end)

  it('traffic_calming=choker works with direction', function()
    local tags = {
      ["traffic_calming"] = 'choker',
      ["direction"] = 'backward',
    }
    local result = categorize_and_transform_crossing_points({ tags = tags })
    assert.are.equal(result.self.category, nil)

    assert.are.equal(type(result.left), "table")
    assert.are.equal(result.left.category.id, 'traffic_calming_choker')
    assert.are.equal(result.left.category:get_buffer_radius(tags), 3)
    assert.are.equal(result.left.object.tags.side, 'left')

    assert.are.equal(result.right.category, nil)
  end)

  it('traffic_calming=choker works even without direction', function()
    local tags = {
      ["traffic_calming"] = 'choker',
    }
    local result = categorize_and_transform_crossing_points({ tags = tags })
    assert.are.equal(result.self.category, nil)

    assert.are.equal(type(result.left), "table")
    assert.are.equal(result.left.category.id, 'traffic_calming_choker')
    assert.are.equal(result.left.category:get_buffer_radius(tags), 3)
    assert.are.equal(result.left.object.tags.side, 'left')

    assert.are.equal(type(result.right), "table")
    assert.are.equal(result.right.category.id, 'traffic_calming_choker')
    assert.are.equal(result.right.category:get_buffer_radius(tags), 3)
    assert.are.equal(result.right.object.tags.side, 'right')
  end)

  describe('Handle `side_schema=side_suffix`', function()
    it('handles traffic_calming:left and traffic_calming:right', function()
      local tags = {
        ['traffic_calming:left'] = 'choker',
        ['traffic_calming:right'] = 'choker',
        ['some_other'] = 'value',
      }
      local results = categorize_and_transform_crossing_points({ tags = tags })
      assert.are.equal(results.self.category, nil)

      assert.are.equal(type(results.left), 'table')
      assert.are.equal(results.left.category.id, 'traffic_calming_choker')
      assert.are.equal(results.left.object.tags.side, 'left')
      assert.are.equal(results.left.object.tags.traffic_calming, 'choker')
      assert.are.equal(results.left.object.tags['traffic_calming:left'], nil)
      assert.are.equal(results.left.object.tags['traffic_calming:right'], nil)
      assert.are.equal(results.left.object.tags.some_other, 'value')

      assert.are.equal(type(results.right), 'table')
      assert.are.equal(results.right.category.id, 'traffic_calming_choker')
      assert.are.equal(results.right.object.tags.side, 'right')
      assert.are.equal(results.right.object.tags.traffic_calming, 'choker')
      assert.are.equal(results.right.object.tags['traffic_calming:left'], nil)
      assert.are.equal(results.right.object.tags['traffic_calming:right'], nil)
      assert.are.equal(results.right.object.tags.some_other, 'value')
    end)

    it('handles only traffic_calming:left', function()
      local tags = {
        ['traffic_calming:left'] = 'choker',
        ['some_other'] = 'value',
      }
      local result = categorize_and_transform_crossing_points({ tags = tags })
      assert.are.equal(result.self.category, nil)
      assert.are.equal(type(result.left), 'table')
      assert.are.equal(result.left.category.id, 'traffic_calming_choker')
      assert.are.equal(result.left.object.tags.side, 'left')
      assert.are.equal(result.left.object.tags.traffic_calming, 'choker')
      assert.are.equal(result.left.object.tags.some_other, 'value')
      assert.are.equal(result.left.object.tags['traffic_calming:left'], nil)
      assert.are.equal(result.right.category, nil)
    end)

    it('handles only traffic_calming:right', function()
      local tags = {
        ['traffic_calming:right'] = 'choker',
        ['some_other'] = 'value',
      }
      local result = categorize_and_transform_crossing_points({ tags = tags })
      assert.are.equal(result.self.category, nil)
      assert.are.equal(result.left.category, nil)
      assert.are.equal(type(result.right), 'table')
      assert.are.equal(result.right.category.id, 'traffic_calming_choker')
      assert.are.equal(result.right.object.tags.side, 'right')
      assert.are.equal(result.right.object.tags.traffic_calming, 'choker')
      assert.are.equal(result.right.object.tags.some_other, 'value')
      assert.are.equal(result.right.object.tags['traffic_calming:right'], nil)
    end)
  end)

end)
