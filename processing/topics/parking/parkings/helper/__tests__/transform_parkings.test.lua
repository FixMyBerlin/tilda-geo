describe("`transform_parkings`", function()
  require('init')
  local transform_parkings = require('transform_parkings')
  require("Log")
  require('osm2pgsql')

  it('works', function()
    local input_object = {
      tags = {
        highway = 'residential',
        ["parking:left"] = "lane",
        ["parking:right"] = "street_side",
        ["parking:both"] = "lane",
        ["parking:both:fee"] = "no",
      },
      id = 1,
      type = 'way',
    }
    local results = transform_parkings(input_object)

    assert.are.equal(type(results.left), "table")
    assert.are.equal(results.left.tags.side, "left")
    assert.are.equal(results.left.tags.fee, "no")
    assert.are.equal(results.left.tags.parking, "lane")

    assert.are.equal(type(results.right), "table")
    assert.are.equal(results.right.tags.side, "right")
    assert.are.equal(results.right.tags.fee, "no")
    assert.are.equal(results.right.tags.parking, "street_side")
  end)

  it('case one side', function()
    local input_object = {
      tags = {
        highway = 'residential',
        ["parking:left"] = "lane",
      },
      id = 1,
      type = 'way',
    }
    local results = transform_parkings(input_object)

    assert.are.equal(type(results.left), "table")
    assert.are.equal(results.left.tags.side, "left")
    assert.are.equal(results.left.tags.parking, "lane")

    assert.are.equal(type(results.right), "table")
    assert.are.equal(results.right.tags.side, "right")
    assert.are.equal(results.right.tags.parking, nil)
  end)
end)
