describe("`categorize_obstacle_points`", function()
  require('init')
  local categorize_obstacle_points = require("categorize_obstacle_points")
  require("Log")

  it('works', function()
    local tags = {
      ["natural"] = 'tree',
      ["obstacle:parking"] = 'yes',
    }
    local result = categorize_obstacle_points({ tags = tags })
    assert.are.equal(type(result), "table")
    assert.are.equal(result.category.id, 'tree')
  end)

end)
