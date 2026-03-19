describe('to_todo_tags', function()
  require('init')
  local to_todo_tags = require('to_todo_tags')
  local collect_todos = require('collect_todos')
  local road_todo_categories = require('road_todo_categories')
  -- local inspect = require('inspect')

  it('Return id string', function()
    local tags_object = { cycleway = 'shared' }
    local todos = collect_todos(road_todo_categories, tags_object, {})
    local result = to_todo_tags(todos)

    assert.are.same(result, { ['deprecated_cycleway_shared'] = 'prio2' })
  end)

  it('Handle empty list', function()
    local todos = collect_todos(road_todo_categories, {}, {})
    local result = to_todo_tags(todos)
    assert.are.same(result, {})
  end)
end)
