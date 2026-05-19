describe('collect_todos', function()
  local collect_todos = require('topics.helper.collect_todos')
  local road_todo_categories = require('topics.roads_bikelanes.roads.road_todo_categories')
  -- local inspect = require('inspect')

  it('Return id, priority, todoTableOnly', function()
    local tags_object = { cycleway = 'shared' }
    local result = collect_todos(road_todo_categories, tags_object, {})
    local expected = {
      [1] = {
        ['id'] = 'deprecated_cycleway_shared',
        ['priority'] = 'prio2',
        ['todoTableOnly'] = false,
      },
    }
    assert.are.same(result, expected)
  end)

  it('Handle no match', function()
    local result = collect_todos(road_todo_categories, {}, {})
    assert.are.same(result, {})
  end)
end)
