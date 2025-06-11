describe("`categorize_crossing_line`", function()
  require('init')
  local categorize_crossing_line = require("categorize_crossing_line")
  require("Log")

  it('no category matches', function()
    local tags = {
      ["natural"] = 'tree',
      ["obstacle:parking"] = 'yes',
    }
    local result = categorize_crossing_line({ tags = tags })
    assert.are.equal(result.category, nil)
  end)

  it('handles category', function()
    local tags = {
      ["highway"] = 'footway',
      ["footway"] = 'crossing',
    }
    local result = categorize_crossing_line({ tags = tags })

    assert.are.equal(type(result), "table")
    assert.are.equal(result.category.id, 'crossing_way')
    assert.are.equal(result.object.tags.side, 'self')
    assert.are.equal(result.object.tags.highway, 'footway')
    assert.are.equal(result.object.tags.footway, 'crossing')
  end)

  it('handles category zebra before others', function()
    local tags = {
      ["highway"] = 'footway',
      ["footway"] = 'crossing',
      ["crossing_ref"] = 'zebra',
    }
    local result = categorize_crossing_line({ tags = tags })

    assert.are.equal(type(result), "table")
    assert.are.equal(result.category.id, 'crossing_zebra_way')
    assert.are.equal(result.object.tags.side, 'self')
    assert.are.equal(result.object.tags.highway, 'footway')
    assert.are.equal(result.object.tags.footway, 'crossing')
  end)

end)
