describe("ToTodoTags", function()
  require('init')
  require("ToTodoTags")
  require("CollectTodos")
  require("RoadTodos")
  -- local inspect = require('inspect')

  it('Return id string', function()
    local tagsObject = { cycleway = "shared" }
    local todos = CollectTodos(RoadTodos, tagsObject, {})
      local result = ToTodoTags(todos)

    assert.are.same(result, { ['deprecated_cycleway_shared'] = 'prio2' })
  end)

  it('Handle empty list', function()
    local todos = CollectTodos(RoadTodos, {}, {})
    local result = ToTodoTags(todos)
    assert.are.same(result, {})
  end)
end)
