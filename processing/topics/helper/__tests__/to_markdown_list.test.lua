describe('to_markdown_list', function()
  local to_markdown_list = require('topics.helper.to_markdown_list')
  local collect_todos = require('topics.helper.collect_todos')
  local road_todo_categories = require('topics.roads_bikelanes.roads.road_todo_categories')
  local bikelane_todo_categories = require('topics.roads_bikelanes.bikelanes.bikelane_todo_categories')

  it('Return id string', function()
    local tags_object = { cycleway = 'shared' }
    local todos = collect_todos(road_todo_categories, tags_object, {})
    local result = to_markdown_list(todos)

    assert.are.same(result, '* deprecated_cycleway_shared\n')
  end)

  it('Handle empty list with todoTableOnly=false', function()
    local todos = collect_todos(road_todo_categories, {}, {})
    local result = to_markdown_list(todos)
    assert.are.same(result, nil)
  end)

  it('Handle empty list with todoTableOnly=true', function()
    local tags_object = { cycleway = 'track', _age_in_days = 5925 }
    local todos = collect_todos(bikelane_todo_categories, tags_object, {})
    local result = to_markdown_list(todos)
    assert.are.same(result, nil)
  end)
end)
