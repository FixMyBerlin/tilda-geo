describe("ToMarkdownList", function()
  require('init')
  require("ToMarkdownList")
  require("CollectTodos")
  require("RoadTodos")
  require("BikelaneTodos")

  it('Return id string', function()
    local tagsObject = { cycleway = "shared" }
    local todos = CollectTodos(RoadTodos, tagsObject, {})
    local result = ToMarkdownList(todos)

    assert.are.same(result, "* deprecated_cycleway_shared\n")
  end)

  it('Handle empty list with todoTableOnly=false', function()
    local todos = CollectTodos(RoadTodos, {}, {})
    local result = ToMarkdownList(todos)
    assert.are.same(result, nil)
  end)

  it('Handle empty list with todoTableOnly=true', function()
    local tagsObject = { cycleway = "track", _age_in_days = 5925 }
    local todos = CollectTodos(BikelaneTodos, tagsObject, {})
    local result = ToMarkdownList(todos)
    assert.are.same(result, nil)
  end)
end)
