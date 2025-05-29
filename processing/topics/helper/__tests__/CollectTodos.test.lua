describe("CollectTodos", function()
  require('init')
  require("CollectTodos")
  require("RoadTodos")
  -- local inspect = require("inspect")

  it('Return id, priority, todoTableOnly', function()
    local tagsObject = { cycleway = "shared" }
    local result = CollectTodos(RoadTodos, tagsObject, {})
    local expected = {
      [1] = {
        ["id"] = "deprecated_cycleway_shared",
        ["priority"] = "prio2",
        ["todoTableOnly"] = false,
      },
    }
    assert.are.same(result, expected)
  end)

  it('Handle no match', function()
    local result = CollectTodos(RoadTodos, {}, {})
    assert.are.same(result, {})
  end)
end)
